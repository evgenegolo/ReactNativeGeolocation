import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { StyleSheet, View, Text, Button, } from 'react-native';
import { enableLatestRenderer } from 'react-native-maps';
import Map from './components/Map';
import DocumentPicker from 'react-native-document-picker'
import { DOMParser } from 'xmldom';
import { kml } from '@tmcw/togeojson';
import RNFS from 'react-native-fs';
import { GeometryObject } from 'geojson';
import closestPointOnPolygon from './calculate/FindPath'
//needed for google maps
enableLatestRenderer();

//LatLng type declaration
type LatLng = {
    latitude: number,
    longitude: number,
}

//converting from 2 demncinal array to LetLng array type 
const convert = (numbersArray: any[]): Array<LatLng> => {
    let arr: any = [];
    console.log(numbersArray.length);
    for (let i = 0; i < numbersArray.length; i++) {
        arr.push({ latitude: numbersArray[i][1], longitude: numbersArray[i][0] })
    }
    return arr;
}


const App = () => {
    const [kmlFile, setKmlFile] = useState(Array<LatLng>({ latitude: 0.0, longitude: 0.0 }))
    const [inside, setInside] = useState<boolean | undefined>(false);
    const [userPoint, setUserPoint] = useState<number[] | undefined>();
    const [pointsArry, setPointsArray] = useState<number[][] | undefined>();
    const [shortestWay, setShortestWay] = useState<any>();
    const [nerestPoint, setNearestPoint] = useState<number[][] | any>();

    const callback = (point: number[] | undefined) => {
        console.log("call back was called App");
        setUserPoint(point)
    }
    useEffect(() => {
        setInside(checkInside(userPoint, pointsArry));
    }, [userPoint])

    //check if the phone insed the polygon
    const checkInside = (point: number[] | undefined, polyArray: number[][] | undefined) => {
        // ray-casting algorithm based on
        //check if we missing user location or polygon
        if (point === undefined || polyArray === undefined) {
            console.log(`some thing is undfiend point state : ${point} poleArr state : ${polyArray}`)
            return;
        } else {
            let x = point[0], y = point[1];
            setInside(false);
            //will take 2 points at a time 
            for (let A = 0, B = polyArray.length - 1; A < polyArray.length; B = A++) {
                let Ax = polyArray[A][0], Ay = polyArray[A][1];
                let Bx = polyArray[B][0], By = polyArray[B][1];
                // ((Ay > y) != (By > y)) if they both biger or lesser than user y that he is out side
                //
                let intersect = ((Ay > y) != (By > y)) && (x < (Bx - Ax) * (y - Ay) / (By - Ay) + Ax);

                if (intersect) setInside(!inside);
            }
            return inside;
        }
    };
    //find the fater path to the poligon and the nearest point uses method from FindPath.js file
    const findPath = () => {
        //if user inside will abord calculation
        if (inside === true) {
            console.log("abored path calculation user is in the poligon")
        } else {
            if (pointsArry === undefined || userPoint === undefined) {
                console.log(`some thing is not defiend pointsArry state : ${pointsArry} userPoint state : ${userPoint}`)
            } else {
                console.log(pointsArry);
                let temp: any[];
                temp = closestPointOnPolygon(userPoint, pointsArry)
                setNearestPoint([temp[0][0], temp[0][1]]);
                setShortestWay(temp[1])
            }
        }
    }
    //read a file from the phone
    const readFile = async (MyPath: any) => {
        try {
            const path = MyPath;
            const contents = await RNFS.readFile(path, 'utf8');
            return '' + contents;
        } catch (e) {
            console.log(e);
        }
    }
    //read the kml and convertse it to GeoJson after that converts to LatLng 
    const FileSelect = async () => {
        console.log("good")
        try {
            const res = await DocumentPicker.pick({
                // @ts-ignore
                type: ['application/vnd.google-earth.kml+xml'],
                allowMultiSelection: false,

            });
            const readPromise = await readFile(res[0].uri);
            const read = readPromise !== undefined ? readPromise : "empty";

            if (read !== "empty") {
                const theKml = new DOMParser().parseFromString(read);
                const converted = kml(theKml);
                if (converted != null) {
                    //ts can be null work aruond
                    const workAroundVar: any = converted;
                    setKmlFile(convert(workAroundVar.features[0].geometry.coordinates[0]));
                    setPointsArray(workAroundVar.features[0].geometry.coordinates[0]);
                    //checks if the user inside the polygon
                    setInside(checkInside(userPoint, workAroundVar.features[0].geometry.coordinates[0]));
                } else {
                    console.error("kml null");
                }

            } else {
                console.error("empty read");
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // ignore
            } else {
                console.error(err)
            }
        }
    }
    //main commponent
    return (
        <View style={styles.container}>
            <Map coordinatesArray={kmlFile} call={callback} />
            <Text> you are in piont x:{userPoint !== undefined ? userPoint[0] : null} y: {userPoint !== undefined ? userPoint[1] : null}</Text>
            <Text>you are {inside ? "inside the poly" : "outside the poly"}</Text>
            <Text>nearest Point is  x:{nerestPoint !== undefined ? nerestPoint[0] : null} , y:{nerestPoint !== undefined ? nerestPoint[1] : null}  ShortestWayIs:{shortestWay} KM</Text>
            <Button title=' Select KML 📑' onPress={FileSelect} />
            <Button title='Find the shortest path' onPress={findPath} />
        </View >
    );
}

//app style
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        height: 400,
        width: 400,
        justifyContent: 'flex-end',

    },
});

export default App;

