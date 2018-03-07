// @flow

import * as React from 'react'
import {StyleSheet, View, Text, Platform, RefreshControl} from 'react-native'
import {SearchableAlphabetListView} from '../components/searchable-alphabet-listview'
import type {TopLevelViewPropsType} from '../types'
import LoadingView from '../components/loading'
import delay from 'delay'
import {NoticeView} from '../components/notice'
import {Row, Column} from '../components/layout'
import {
	ListRow,
	ListSectionHeader,
	ListSeparator,
	Detail,
	Title,
} from '../components/list'
import {trackOrgOpen} from '../../analytics'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import size from 'lodash/size'
import sortBy from 'lodash/sortBy'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import filter from 'lodash/filter'
import startCase from 'lodash/startCase'
import * as c from '../components/colors'
import type {StudentOrgType} from './types'
import {
	parseHtml,
	cssSelect,
	getTrimmedTextWithSpaces,
	getTextWithSpaces,
} from '../../lib/html'

const orgsUrl = 'https://apps.carleton.edu/student/orgs/'
const leftSideSpacing = 20
const ROW_HEIGHT = Platform.OS === 'ios' ? 58 : 74
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const orgToArray = (term: StudentOrgType) =>
	uniq([
		...splitToArray(term.name),
		//...splitToArray(term.category),
		...splitToArray(term.description),
	])

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	row: {
		height: ROW_HEIGHT,
		paddingRight: 2,
	},
	rowDetailText: {
		fontSize: 14,
	},
	rowSectionHeader: {
		height: SECTION_HEADER_HEIGHT,
	},
	badgeContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
		width: leftSideSpacing,
	},
	badge: {
		fontSize: Platform.OS === 'ios' ? 24 : 28,
		color: c.transparent,
	},
})

type Props = TopLevelViewPropsType

type State = {
	orgs: Array<StudentOrgType>,
	results: {[key: string]: StudentOrgType[]},
	refreshing: boolean,
	error: boolean,
	loading: boolean,
}

export class StudentOrgsView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'Student Orgs',
		headerBackTitle: 'Orgs',
	}

	searchBar: any

	state = {
		orgs: [],
		results: {},
		refreshing: false,
		loading: true,
		error: false,
	}

	componentWillMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	domToOrg = (orgNode: any): StudentOrgType => {
		// todo:
		//  * harvest social links (FB, Instagram, Twitter, etc)

		const name = getTextWithSpaces(cssSelect('h4', orgNode))
			.replace(/ Manage$/, '')
			.trim()

		const description = getTrimmedTextWithSpaces(
			cssSelect('.orgDescription', orgNode),
		)

		let contacts = getTrimmedTextWithSpaces(cssSelect('.contacts', orgNode))
		contacts = contacts.replace(/^Contact: /, '')
		contacts = contacts ? contacts.split(', ') : []

		const websiteEls = cssSelect('.site a', orgNode).map(n => n.attribs.href)
		const website = websiteEls.length ? websiteEls[0] : ''

		// cssSelect supports a "parent selector"
		const socialLinks = cssSelect('img < a', orgNode).map(n => n.attribs.href)

		return {
			contacts,
			description,
			name,
			website,
			categories: [],
			socialLinks,
		}
	}

	fetchData = async () => {
		const page = await fetch(orgsUrl).then(r => r.text())
		const dom = parseHtml(page)

		const allOrgWrappers = cssSelect('.orgContainer,.careerField', dom)
		const orgs = new Map()

		let currentCategory = null
		for (const orgNode of allOrgWrappers) {
			if (orgNode.attribs.class && orgNode.name === 'h3') {
				currentCategory = getTextWithSpaces(orgNode).trim()
				continue
			}

			const org = this.domToOrg(orgNode)
			if (!orgs.has(org.name)) {
				orgs.set(org.name, org)
			}

			const stored = orgs.get(org.name)
			if (!stored || !currentCategory) {
				continue
			}
			stored.categories.push(currentCategory)
		}

		const sortableRegex = /^(Carleton( College)?|The) +/i
		const withSortableNames = Array.from(orgs.values()).map(item => {
			const sortableName = item.name.replace(sortableRegex, '')

			return {
				...item,
				$sortableName: sortableName,
				$groupableName: startCase(sortableName)[0],
			}
		})

		const sorted = sortBy(withSortableNames, '$sortableName')
		const grouped = groupBy(sorted, '$groupableName')
		this.setState(() => ({orgs: sorted, results: grouped}))
	}

	refresh = async () => {
		const start = Date.now()
		this.setState(() => ({refreshing: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}
		this.setState(() => ({refreshing: false}))
	}

	renderSectionHeader = ({title}: {title: string}) => (
		<ListSectionHeader style={styles.rowSectionHeader} title={title} />
	)

	renderRow = ({item}: {item: StudentOrgType}) => (
		<ListRow
			arrowPosition="none"
			contentContainerStyle={styles.row}
			onPress={() => this.onPressRow(item)}
		>
			<Title lines={1}>{item.name}</Title>
			<Detail lines={1} style={styles.rowDetailText}>
				{item.categories.join(' • ')}
			</Detail>
		</ListRow>
	)

	renderSeparator = (sectionId: string, rowId: string) => (
		<ListSeparator key={`${sectionId}-${rowId}`} />
	)

	onPressRow = (data: StudentOrgType) => {
		trackOrgOpen(data.name)
		this.props.navigation.navigate('StudentOrgsDetailView', {org: data})
	}

	performSearch = (text: ?string) => {
		if (!text) {
			this.setState(state => ({
				results: groupBy(state.orgs, '$groupableName'),
			}))
			return
		}

		const query = text.toLowerCase()
		this.setState(state => {
			const filteredResults = filter(state.orgs, org =>
				orgToArray(org).some(word => word.startsWith(query)),
			)
			return {results: groupBy(filteredResults, '$groupableName')}
		})
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		if (!size(this.state.orgs)) {
			return <NoticeView text="No organizations found." />
		}

		const refreshControl = (
			<RefreshControl
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
			/>
		)

		return (
			<SearchableAlphabetListView
				cell={this.renderRow}
				cellHeight={
					ROW_HEIGHT +
					(Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
				}
				data={this.state.results}
				onSearch={this.performSearch}
				refreshControl={refreshControl}
				renderSeparator={this.renderSeparator}
				sectionHeader={this.renderSectionHeader}
				sectionHeaderHeight={SECTION_HEADER_HEIGHT}
				style={styles.wrapper}
			/>
		)
	}
}
