// @flow

import moment from 'moment'
import flatten from 'lodash/flatten'
import groupBy from 'lodash/groupBy'

import type {EventType, GoogleEventType} from './types'
import {parseHtml, cssSelect, getText, type HtmlElement} from '../../lib/html'
import qs from 'querystring'

import {GOOGLE_CALENDAR_API_KEY} from '../../lib/config'

type ReasonEventFromHtml = {
	id: string,
	title: string,
	date?: string,
	allDay?: boolean,
	ongoing?: boolean,
}

const startDate = () => moment().startOf('day')
const endDate = () =>
	moment()
		.add(1, 'week')
		.endOf('day')

async function gcal(id: string, start: moment, end: moment): {[key: string]: GoogleEventType} {
	const params = {
		orderBy: 'startTime',
		showDeleted: false,
		singleEvents: true,
		timeMin: start.toISOString(),
		timeMax: end.toISOString(),
		key: GOOGLE_CALENDAR_API_KEY,
		fields: 'kind,items(location,start/dateTime,end/dateTime,iCalUID)',
	}
	const stringified = qs.stringify(params)

	const url = `https://www.googleapis.com/calendar/v3/calendars/${id}/events?${stringified}`

	let result = await fetchJson(url)
	for (let event of result.items) {
		event.id = event.iCalUID.split('-')[1].split('@')[0]
		delete event.iCalUID

		if (event.start) {
			event.startTime = event.start.dateTime
			delete event.start
		}
		if (event.end) {
			event.endTime = event.end.dateTime
			delete event.end
		}
	}

	return groupBy(result.items, item => item.id)
}

async function reasonHtml(
	baseUrl: string,
	start: moment = startDate(),
	end: moment = endDate(),
): Array<ReasonEventFromHtml> {
	const params = {
		// eslint-disable-next-line camelcase
		start_date: start.format('YYYY-MM-DD'),
		// eslint-disable-next-line camelcase
		end_date: end.format('YYYY-MM-DD'),
	}
	const url = `${baseUrl}?${qs.stringify(params)}`

	const htmlContent = await fetch(url).then(r => r.text())
	const soup = parseHtml(htmlContent)

	const ongoing = cssSelect('.ongoingEvents > .event', soup).map(
		parseOngoingEvent,
	)

	const events = cssSelect('.dayblock', soup).map(parseDayEvents)

	return [...ongoing, ...flatten(events)]
}

function parseDayEvents(dayblock: HtmlElement) {
	const date = moment(dayblock.attribs.id.split('_')[1], 'YYYY-MM-DD')

	const allDayEvents = cssSelect('.event.allDay', dayblock).map(
		parseAllDayEvent(date),
	)

	const timedEvents = cssSelect('.event.hasTime', dayblock).map(
		parseSingleEvent(date),
	)

	return [...allDayEvents, ...timedEvents]
}

const parseAllDayEvent = (date: moment) => (event: HtmlElement) => ({
	...parseEvent(event),
	date: date.format('YYYY-MM-DD'),
	allDay: true,
})
const parseSingleEvent = (date: moment) => (event: HtmlElement) => ({
	...parseEvent(event),
	date: date.format('YYYY-MM-DD'),
})
const parseOngoingEvent = event => ({...parseEvent(event), isOngoing: true})

function parseEvent(event: HtmlElement) {
	const link = cssSelect.selectOne('a', event)
	const href = link.attribs.href.replace('?', '').replace(/&amp;/g, '&')
	const id = qs.parse(href).event_id
	const title = getText(link)
	return {id, title}
}

function mergeEventInfo(
	fromReason: Array<ReasonEventFromHtml>,
	fromGoogle: {[key: string]: GoogleEventType},
): {expanded: Array<EventType>, missing: Array<string>} {
	const expanded = []
	const missing = []
	for (let event of fromReason) {
		let gevent = fromGoogle[event.id]
		if (!gevent) {
			missing.push(event.id)
			continue
		}
		expanded.push({...event, ...gevent})
	}
	return {expanded, missing}
}

export async function fetchReasonCalendar(
	reasonUrl: string,
	googleId: string,
	start: moment,
	end: moment,
): Promise<{events: Array<EventType>, missing: Array<string>}> {
	const [basicMetadata, calendarMetadata] = await Promise.all([
		reasonHtml(reasonUrl, start, end),
		gcal(googleId, start, end),
	])

	const {expanded: events, missing} = mergeEventInfo(
		basicMetadata,
		calendarMetadata,
	)

	return {events, missing}
}
