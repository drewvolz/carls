// @flow
import * as React from 'react'
import {NoonNewsRowView} from './row'
import {reportNetworkProblem} from '../../../lib/report-network-problem'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '../../components/list'
import {NoticeView} from '../../components/notice'
import LoadingView from '../../components/loading'
import * as c from '../../components/colors'
import delay from 'delay'
import type {NewsBulletinType} from './types'

const URL = 'https://carleton.api.frogpond.tech/v1/news/named/nnb'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.white,
	},
})

type Props = {}

type State = {
	bulletins: Array<{title: string, data: Array<NewsBulletinType>}>,
	loading: boolean,
	refreshing: boolean,
}

export class NoonNewsView extends React.PureComponent<Props, State> {
	state = {
		bulletins: [],
		loading: true,
		refreshing: false,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	refresh = async (): any => {
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

	fetchData = async () => {
		const bulletins = await fetchJson(URL).catch(err => {
			reportNetworkProblem(err)
			return []
		})

		this.setState(() => ({bulletins}))
	}

	renderSectionHeader = ({section: {title}}: any) => (
		<ListSectionHeader title={title} />
	)

	renderItem = ({item}: {item: NewsBulletinType}) => (
		<NoonNewsRowView bulletin={item} />
	)

	keyExtractor = (item: NewsBulletinType, index: number) => index.toString()

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		return (
			<SectionList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="No bulletins." />}
				keyExtractor={this.keyExtractor}
				onRefresh={this.refresh}
				refreshing={this.state.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={(this.state.bulletins: any)}
				style={styles.listContainer}
			/>
		)
	}
}
