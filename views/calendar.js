/**
 * All About Olaf
 * Calendar page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ListView,
} from 'react-native'

import NavigatorScreen from './components/navigator-screen'
import EventView from './components/event'
import * as k from '../keys'

export default class CalendarView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      masterEvents: null,
      olevilleEvents: null,
      masterLoaded:false,
      olevilleLoaded:false,
      error: false,
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.summary != r2.summary
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Calendar"
      renderScene={this.renderScene.bind(this)}
    />
  }

  componentWillMount() {
    var nowDate = new Date();
    var nowString = nowDate.toISOString(); // As needed by the Google Calendar API
    var offset = (nowDate.getTimezoneOffset() / 60);
    var offsetString = "-" + offset + ":00Z";
    nowString.replace('Z', offsetString);
    this.getMasterEvents(k.calendarKey, nowString);
    //this.state.olevilleEvents = this.getOlevilleEvents();

  }

  async getMasterEvents(apiKey, currentTime) {
    try {
      let response = await fetch ('https://www.googleapis.com/calendar/v3/calendars/le6tdd9i38vgb7fcmha0hu66u9gjus2e%40import.calendar.google.com/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin=' + currentTime + '&key=' + apiKey)
      let responseJson = await response.json();
      this.setState({masterEvents: responseJson});
    } catch (error) {
      this.setState({error: true});
      console.error(error);
    }
    this.setState({masterLoaded: true});
  }

  async getOlevilleEvents(apiKey, currentTime) {
    try {
      let response = await fetch ('https://www.googleapis.com/calendar/v3/calendars/stolaf.edu_fvulqo4larnslel75740vglvko@group.calendar.google.com/events?maxResults=50&orderBy=startTime&showDeleted=false&singleEvents=true&timeMin=' + currentTime + '&key=' + apiKey)
      let responseJson = await response.json();
      this.setState({olevilleEvents: responseJson});
    } catch (error) {
      this.setState({error: true});
      console.error(error);
    }
    this.setState({olevilleLoaded: true});
  }

  _renderRow(data) {
    return (
      <View style={styles.row}>
        <EventView eventTitle={data.summary} startTime={data.start.dateTime} endTime={data.end.dateTime} location={data.location} />
      </View>
    )
  }

  // Render a given scene
  renderScene() {
    if (this.state.masterEvents != null) {
      let ds = new ListView.DataSource({
        rowHasChanged: this._rowHasChanged,
      })
      return (
        <View style={styles.container}>
          <ListView
            dataSource={ds.cloneWithRows(this.state.masterEvents.items)}
            renderRow={this._renderRow.bind(this)}
          />
        </View>
      )
    } else {
      return (
        <Text> Loading </Text>
      )
    }
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {

  },
  title:{

  }
})
