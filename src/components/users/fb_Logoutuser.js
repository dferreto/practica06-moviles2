import React, {useState, useEffect} from 'react';
		import {View, Text} from 'react-native';
		import auth from '@react-native-firebase/auth';

		const LogoutUser = () => {
		  const [estado, setEstado] = useState();

		  const salir = async () => {
			auth()
			  .signOut()
			  .then(() => {
				console.log('User is signed out!');
				setEstado('User is signed out!');
			  });
		  };

		  useEffect(() => {
			salir();
		  }, []);

		  return (
			<View>
			  <Text>Close User Session</Text>
			  <Text>{estado}</Text>
			</View>
		  );
		};

		export default LogoutUser;