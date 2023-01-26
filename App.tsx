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
enableLatestRenderer();



type LatLng = {
    latitude: number,
    longitude: number,
}

//converting to LetLng array
const convert = (numbersArray: any[]): Array<LatLng> => {
    let arr: any = [];
    console.log(numbersArray.length);
    for (let i = 0; i < numbersArray.length; i++) {
        arr.push({ latitude: numbersArray[i][1], longitude: numbersArray[i][0] })
    }

    return arr;
}
const checkInside = (point: number[] | undefined, polyArray: number[][] | undefined) => {
    console.log(point);
    console.log(polyArray);
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    if (point === undefined || polyArray === undefined) {
        console.log(`some thing is undfiend point state : ${point} poleArr state : ${polyArray}`)
        return;
    } else {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = polyArray.length - 1; i < polyArray.length; j = i++) {
            let xi = polyArray[i][0], yi = polyArray[i][1];
            let xj = polyArray[j][0], yj = polyArray[j][1];

            let intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
};


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


    const findPath = () => {
        if (inside === true) {
            console.log("abored path calculation user is in the poligon")
        } else {
            if (pointsArry === undefined || userPoint === undefined) {
                console.log(`some thing is not defiend pointsArry state : ${pointsArry} userPoint state : ${userPoint}`)
            } else {
                console.log(pointsArry);
                let temp: any[];
                temp = closestPointOnPolygon(userPoint, pointsArry)
                console.log(temp);
                console.log(userPoint);
                console.log(closestPointOnPolygon(userPoint, pointsArry))
                setNearestPoint([temp[0][0], temp[0][1]]);
                setShortestWay(temp[1])
            }
        }
    }

    const readFile = async (MyPath: any) => {
        try {
            const path = MyPath;
            const contents = await RNFS.readFile(path, 'utf8');
            return '' + contents;
        } catch (e) {
            console.log(e);
        }
    }

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
                    const a: any = converted;
                    setKmlFile(convert(a.features[0].geometry.coordinates[0]));
                    setPointsArray(a.features[0].geometry.coordinates[0]);
                    setInside(checkInside(userPoint, a.features[0].geometry.coordinates[0]));
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
    const log = () => console.log(kmlFile)
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

