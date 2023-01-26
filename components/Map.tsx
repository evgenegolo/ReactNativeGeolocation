import Geolocation from 'react-native-geolocation-service';
import MapView, { PROVIDER_GOOGLE, Geojson, Polygon, Callout } from 'react-native-maps'; // remove PROVIDER_GOOGLE import if not using Google Maps
import React, { useState, useEffect, useReducer } from 'react';
import { StyleSheet, View, Text, Button, PermissionsAndroid } from 'react-native';
const KML_FILE = "./Bad_sample.kml"





const Map = (_props: any) => {
    // dump geo postion object data
    //used if so the app wont crush when we have no geo data from the phone
    const dump: Geolocation.GeoPosition = {
        coords: {
            accuracy: 0,
            altitude: 0,
            altitudeAccuracy: 0.,
            heading: 0,
            latitude: 0,
            longitude: 0,
            speed: 0
        },
        mocked: false,
        provider: "fused",
        timestamp: 0
    };

    //use state declarations
    const [time, setTime] = useState(Date.now());
    const [isLocation, setIsLocation] = useState(false);
    const [location, setLocation] = useState(dump);
    const [coordinates, setCordinates] = useState(_props.coordinatesArray);

    //requests to use geo location
    const requestLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Geolocation Permission',
                    message: 'Can we access your location?',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            console.log('granted', granted);
            if (granted === 'granted') {
                console.log('You can use Geolocation');
                return true;
            } else {
                console.log('You cannot use Geolocation');
                return false;
            }
        } catch (err) {
            return false;
        }
    };

    //get user geo position refresh it self evrey second
    //pass the positin to perent commponent
    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        const result = requestLocationPermission();
        result.then(res => {
            console.log('res is:', res);
            if (res) {
                Geolocation.getCurrentPosition(
                    position => {
                        setLocation(position);
                        console.log("call back was called Map");
                        _props.call([position.coords.longitude, position.coords.latitude])
                        return () => {
                            clearInterval(interval);
                        };
                    },
                    error => {
                        console.log(error.code, error.message);
                        setIsLocation(false);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
                );
            }

        });
    }, []);

    //refresh the commponent and set new polygon array evrey time it changes in perrent component 
    useEffect(() => {
        console.log('useEffect logic ran');
        setCordinates(_props.coordinatesArray);
    }, [_props.coordinatesArray])

    return (
        <MapView
            provider={PROVIDER_GOOGLE} // remove if not using Google Maps
            style={styles.map}
            showsCompass={true}
            showsUserLocation
            region={{
                latitude: location.coords.latitude,
                longitude: location.coords.latitude,
                latitudeDelta: 3.015,
                longitudeDelta: 3.0121,
            }}
        >
            <Polygon
                coordinates={coordinates} //geo position array
                fillColor="#00000"
            />
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        height: 300,
        width: 400,
    }
})

export default Map;