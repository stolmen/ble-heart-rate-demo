import React,{Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import {LineChart} from 'react-d3-basic';

class FakeHrSource {

    constructor() {
    }
    listen(cb) {
        this.cb = cb;
        // start listening to heart rate.
        // call callback once per new value
        setInterval(this.newFakeFr.bind(this), 1000)
    }
    newFakeFr() {
        const fakeHr = Math.random(50, 100)*50+50;
        this.cb(fakeHr);
    }

}

class BleHrSource {
    constructor() {

    }
    listen(cb) {
        this.cb = cb;
        return navigator.bluetooth.requestDevice({filters: [{services: ['heart_rate']}]})
            .then(device => {
                return device.gatt.connect();
            })
            .then(server => {
                return server.getPrimaryService('heart_rate')
            })
            .then(service => {
                return service.getCharacteristic('heart_rate_measurement')
            })
            .then(character => {
                this.characteristic = character;
                return this.characteristic.startNotifications().then(_ => {
                    this.characteristic.addEventListener('characteristicvaluechanged',
                        this.heartRateChange.bind(this));
                });
            })
            .catch(e => console.error(e));
    }

    heartRateChange(event) {
        const value = event.target.value;
        const currentHeartRate = value.getUint8(1);
        this.cb(currentHeartRate);
    }
}


const hr_source_cls = BleHrSource;


export default class App extends Component {

    characteristic;
    constructor(){
        super();
        this.state = { chartData: []};
        this.startMonitoring = this.startMonitoring.bind(this);
    }

    startMonitoring(){
        this.hr_source = new hr_source_cls();
        // this.hr_source = new FakeHrSource();
        this.hr_source.listen(this.onNewHr.bind(this));
    }

    // heartRateChange(event){
    //     const value = event.target.value;
    //     const currentHeartRate = value.getUint8(1);
    //     const chartData = [...this.state.chartData, {time: +Date.now(),heartRate:currentHeartRate}];
    //     this.setState({chartData});
    //     console.log('currentHeartRate:', currentHeartRate);
    // }

    onNewHr(bpm) {
        const chartData = [...this.state.chartData, {time: +Date.now(),heartRate:bpm}];
        this.setState({chartData});
        console.log('currentHeartRate:', bpm);
    }

    // BLEConnect(){
    //     return navigator.bluetooth.requestDevice({filters: [{services: ['heart_rate']}]})
    //         .then(device => {
    //             return device.gatt.connect();
    //         })
    //         .then(server => {
    //             return server.getPrimaryService('heart_rate')
    //         })
    //         .then(service => {
    //             return service.getCharacteristic('heart_rate_measurement')
    //         })
    //         .then(character => {
    //             this.characteristic = character;
    //             return this.characteristic.startNotifications().then(_ => {
    //                 this.characteristic.addEventListener('characteristicvaluechanged',
    //                     this.heartRateChange.bind(this));
    //             });
    //         })
    //         .catch(e => console.error(e));
    // }

    render() {
        const currentHeartRate = this.state.chartData[this.state.chartData.length-1];
        const minHeartRate = Math.min(...this.state.chartData.map(x=>x.heartRate));
        const margins = {left: 100, right: 100, top: 20, bottom: 50};
        const chartSeries = [
            {
                field: 'heartRate',
                color: '#C20000'
            }
        ];

        return(
            <div id="app">
                <RaisedButton onClick={this.startMonitoring} label="Start Monitoring!" primary={true} />
                {currentHeartRate && <p>Current Heart Rate: <span style={{color:'#C20000'}}>{currentHeartRate.heartRate}</span></p>}
                {currentHeartRate && <p>Minimum Heart Rate: <span style={{color:'#C20000'}}>{minHeartRate}</span></p>}
                <LineChart
                    margins= {margins}
                    data={this.state.chartData}
                    width={1600}
                    height={700}
                    chartSeries={chartSeries}
                    x={(d) => d.time}
                    xScale='time'
                />
            </div>
        );
    }
}
