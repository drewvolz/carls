// @flow

import * as React from 'react'
import {EventList} from './event-list'
import bugsnag from '../../bugsnag'
import {tracker} from '../../analytics'
import type {TopLevelViewPropsType} from '../types'
import type {EventType, PoweredBy} from './types'
import moment from 'moment-timezone'
import delay from 'delay'
import LoadingView from '../components/loading'
import querystring from 'querystring'
const TIMEZONE = 'America/Winnipeg'

type Props = TopLevelViewPropsType & {
	calendar:
		| string
		| {type: 'google', id: string}
		| {type: 'reason', url: string}
		| {type: 'ics', url: string},
	detailView?: string,
	eventMapper?: EventType => EventType,
	poweredBy: ?PoweredBy,
}

type State = {
	events: EventType[],
	loading: boolean,
	refreshing: boolean,
	error: ?Error,
	now: moment,
}

export class CccCalendarView extends React.Component<Props, State> {
	state = {
		events: [],
		loading: true,
		refreshing: false,
		error: null,
		now: moment.tz(TIMEZONE),
	}

	componentDidMount() {
		this.getEvents().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	convertEvents(data: EventType[]): EventType[] {
		let events = data.map(event => {
			const startTime = moment(event.startTime)
			const endTime = moment(event.endTime)

			return {
				...event,
				startTime,
				endTime,
			}
		})

		if (this.props.eventMapper) {
			events = events.map(this.props.eventMapper)
		}

		return events
	}

	getEvents = async (now: moment = moment.tz(TIMEZONE)) => {
		let url
		if (typeof this.props.calendar === 'string') {
			url = `https://carleton.api.frogpond.tech/v1/calendar/named/${
				this.props.calendar
			}`
		} else if (this.props.calendar.type === 'google') {
			let qs = querystring.stringify({id: this.props.calendar.id})
			url = `https://carleton.api.frogpond.tech/v1/calendar/google?${qs}`
		} else if (this.props.calendar.type === 'reason') {
			let qs = querystring.stringify({url: this.props.calendar.url})
			url = `https://carleton.api.frogpond.tech/v1/calendar/reason?${qs}`
		} else if (this.props.calendar.type === 'ics') {
			let qs = querystring.stringify({url: this.props.calendar.url})
			url = `https://carleton.api.frogpond.tech/v1/calendar/ics?${qs}`
		}

		let data: EventType[] = []
		try {
			data = await fetchJson(url)
		} catch (err) {
			tracker.trackException(err.message)
			bugsnag.notify(err)
			this.setState({error: err.message})
			console.warn(err)
		}

		this.setState({now, events: this.convertEvents(data)})
	}

	refresh = async () => {
		let start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.getEvents()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({refreshing: false}))
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		return (
			<EventList
				detailView={this.props.detailView}
				events={this.state.events}
				message={this.state.error ? this.state.error.message : null}
				navigation={this.props.navigation}
				now={this.state.now}
				onRefresh={this.refresh}
				poweredBy={this.props.poweredBy}
				refreshing={this.state.refreshing}
			/>
		)
	}
}
