import React, { useState, useEffect, useRef, useCallback } from 'react';
			import { Image, View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Alert } from 'react-native';
			import { Camera, useCameraDevices } from 'react-native-vision-camera';
			import storage from '@react-native-firebase/storage';
			import firestore from '@react-native-firebase/firestore';

			const InsPicture = () => {
				const camera = useRef(null);
				const devices = useCameraDevices();
				const device = devices[0];

				const [showCamera, setShowCamera] = useState(false);
				const [imageSource, setImageSource] = useState(null);
				const [isLoading, setIsLoading] = useState(false);

				useEffect(() => {
					console.log('Before requesting camera permission');
					async function initializeCamera() {
						try {
							console.log('Requesting camera permission');
							const granted = await PermissionsAndroid.request(
								PermissionsAndroid.PERMISSIONS.CAMERA,
								{
									title: 'Camera Permission',
									message: 'This app needs access to your camera.',
									buttonNeutral: 'Ask Me Later',
									buttonNegative: 'Cancel',
									buttonPositive: 'OK',
								}
							);

							if (granted === PermissionsAndroid.RESULTS.GRANTED) {
								console.log('Camera permission granted');
								setShowCamera(true);
							} else {
								console.log('Camera permission denied');
							}
						} catch (err) {
							console.warn(err);
						}
					}

					initializeCamera();
				}, []);

				const saveAndDisplayPhoto = useCallback(async (file) => {
					setIsLoading(true);
					try {
						// Upload the image to Firebase Storage
						const storageRef = storage().ref('images/${file.path}');
						await storageRef.putFile(file.path);

						// Get the download URL
						const downloadURL = await storageRef.getDownloadURL();

						// Save the download URL to Firestore
						await firestore().collection('images').add({
							url: downloadURL,
							createdAt: firestore.FieldValue.serverTimestamp(),
						});

						setImageSource(downloadURL);

						// Show alert for photo taken and saved
						Alert.alert('Success', 'Photo taken and saved successfully!');

						// Close the camera after setting the image source
						setShowCamera(false);
					} catch (e) {
						console.error('Error uploading image or saving to Firestore:', e);
						Alert.alert('Error', 'An error occurred while saving the photo.');
					} finally {
						setIsLoading(false);
					}
				}, []);

				const takePicture = useCallback(async () => {
					console.log('takePicture');
					if (!camera.current) {
						console.log('No camera defined');
						return;
					}

					try {
						const file = await camera.current.takePhoto({
							qualityPrioritization: 'speed',
							flash: 'on',
							enableShutterSound: false,
							quality: '100',
							exif: true,
						});

						console.log('Picture taken', file);

						// Save and display the photo
						await saveAndDisplayPhoto(file);
					} catch (e) {
						console.log('Error', e);
						Alert.alert('Error', 'An error occurred while taking the photo.');
					}
				}, [saveAndDisplayPhoto]);

				const retakePicture = () => {
					// Reset image source to null
					setImageSource(null);
					// Show the camera again
					setShowCamera(true);
				};

				if (devices == null) {
					return (
						<View style={styles.container}>
							<Text style={styles.text}>No camera available</Text>
						</View>
					);
				}

				if (showCamera) {
					return (
						<View style={styles.container}>
							<Camera
								ref={(ref) => (camera.current = ref)}
								device={device}
								isActive={showCamera}
								photo={true}
								onInitialized={() => setShowCamera(true)}
								style={styles.camera}
							/>
							<TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={isLoading}>
								<Text style={styles.text}>{isLoading ? 'Loading...' : 'Take picture'}</Text>
							</TouchableOpacity>
						</View>
					);
				} else {
					return (
						<View style={styles.container}>
							{imageSource ? (
								<>
									<Image style={styles.image} source={{ uri: imageSource }} />
									<TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
										<Text style={styles.text}>Take Another Photo</Text>
									</TouchableOpacity>
								</>
							) : (
								<Text style={styles.text}>Waiting for a picture...</Text>
							)}
						</View>
					);
				}
			};
			
	
			const styles = StyleSheet.create({
				container: {
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'black',
				},
				camera: {
					flex: 1,
					width: '70%',
					aspectRatio: 3 / 4,
				},
				image: {
					flex: 1,
					width: '100%',
					height: '100%',
				},
				captureButton: {
					position: 'absolute',
					bottom: 20,
					alignSelf: 'center',
					backgroundColor: 'blue',
					padding: 10,
					borderRadius: 5,
				},
				retakeButton: {
					position: 'absolute',
					bottom: 20,
					backgroundColor: 'red',
					padding: 10,
					borderRadius: 5,
				},
				text: {
					color: 'white',
					fontSize: 14,
					fontWeight: 'bold',
					textAlign: 'center',
				},
			});

			export default InsPicture;
		