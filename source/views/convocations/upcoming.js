// @flow

import React from 'react'
import {ReasonCalendarView} from '../calendar/calendar-reason'
import {TabBarIcon} from '../components/tabbar-icon'
import type {TopLevelViewPropsType} from '../types'

type Props = TopLevelViewPropsType

export class UpcomingConvocationsView extends React.PureComponent<Props> {
	static navigationOptions = {
		tabBarLabel: 'Upcoming',
		tabBarIcon: TabBarIcon('planet'),
	}

	render() {
		return (
			<ReasonCalendarView
				calendarUrl="https://apps.carleton.edu/events/convocations/"
				googleCalendarId="n6bc0o0hgm9gu3npdpks17ukir3tbadf@import.calendar.google.com"
				navigation={this.props.navigation}
				poweredBy={{
					title: 'Powered by the Carleton Calendar',
					href: 'https://carleton.edu/calendar',
				}}
			/>
		)
	}
}
