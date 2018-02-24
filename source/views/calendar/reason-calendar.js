#!/usr/bin/env node
'use strict'

// const got = require('got')
const html = require('htmlparser2')
const select = require('css-select')
const moment = require('moment')
const flatten = require('lodash/flatten')

const qs = require('querystring')
const GOOGLE_CALENDAR_API_KEY = ''

const startDate = () => moment().startOf('day')
const endDate = () =>
	moment()
		.add(1, 'week')
		.endOf('day')

let calendarId = 'c7lu6q4995afqqv43de8okj416pajcf8@import.calendar.google.com'
async function gcal(id = calendarId, start = startDate(), end = endDate()) {
	let calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${id}/events`
	let params = {
		orderBy: 'startTime',
		showDeleted: false,
		singleEvents: true,
		timeMin: start.toISOString(),
		timeMax: end.toISOString(),
		key: GOOGLE_CALENDAR_API_KEY,
		// fields: 'kind,items(summary,location,start/dateTime,end/dateTime,iCalUID)',
		fields: 'kind,items(location,start/dateTime,end/dateTime,iCalUID)',
	}
	const url = `${calendarUrl}?${qs.stringify(params)}`

	// let result = (await got(url, {json: true})).body
	let result = await fetchJson(url)
	for (let event of result.items) {
		event.id = event.iCalUID.split('-')[1].split('@')[0]
		delete event.iCalUID
		if (event.start) {
			event.start = event.start.dateTime
		}
		if (event.end) {
			event.end = event.end.dateTime
		}
	}
	return result.items.reduce(
		(coll, item) => Object.assign(coll, {[item.id]: item}),
		{},
	)
}

async function reasonHtml(baseUrl, start = startDate, end = endDate) {
	const params = {
		// eslint-disable-next-line camelcase
		start_date: start.format('YYYY-MM-DD'),
		// eslint-disable-next-line camelcase
		end_date: end.format('YYYY-MM-DD'),
	}
	const url = `${baseUrl}?${qs.stringify(params)}`
	// const htmlContent = (await got(url)).body
	const htmlContent = await fetch(url).then(r => r.text())
	const soup = html.parseDOM(htmlContent)

	const ongoing = select('.ongoingEvents > .event', soup).map(parseOngoingEvent)
	const events = select('.dayblock', soup).map(parseDayEvents)

	return [...ongoing, ...flatten(events)]
}

function getText(elem) {
	if (Array.isArray(elem)) return elem.map(getText).join('')
	if (elem.type === 'tag') return getText(elem.children)
	if (elem.type === 'text') return elem.data
	return ''
}

function parseDayEvents(dayblock) {
	const date = dayblock.attribs.id.split('_')[1]
	const allDayEvents = select('.event.allDay', dayblock).map(
		parseAllDayEvent(date),
	)
	const timedEvents = select('.event.hasTime', dayblock).map(
		parseSingleEvent(date),
	)
	return [...allDayEvents, ...timedEvents]
}

const parseAllDayEvent = date => event =>
	Object.assign({}, parseEvent(event), {date, allDay: true})
const parseSingleEvent = date => event =>
	Object.assign({}, parseEvent(event), {date})
const parseOngoingEvent = event =>
	Object.assign({}, parseEvent(event), {ongoing: true})

function parseEvent(event) {
	const link = select.selectOne('a', event)
	const href = link.attribs.href.replace('?', '').replace(/&amp;/g, '&')
	const id = qs.parse(href).event_id
	const title = getText(link)
	return {id, title}
}

function mergeEventInfo(fromReason, fromGoogle) {
	const expanded = []
	const missing = []
	for (let event of fromReason) {
		let gevent = fromGoogle[event.id]
		if (!gevent) {
			missing.push(event.id)
			continue
		}
		expanded.push(Object.assign({}, event, gevent))
	}
	return {expanded, missing}
}

export async function fetchReasonCalendar(reasonUrl, googleId, start, end) {
	const [basicMetadata, calendarMetadata] = await Promise.all([
		reasonHtml(reasonUrl, start, end),
		gcal(googleId, start, end),
	])

	const {expanded: events, missing} = mergeEventInfo(basicMetadata, calendarMetadata)

	return {events, missing}

	// // const remaining = Promise.all(missing.map(fetchFullEventInfo))

	// console.log(JSON.stringify(events))
	// console.log(JSON.stringify(missing))
}
