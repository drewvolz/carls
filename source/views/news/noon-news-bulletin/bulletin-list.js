// @flow

import React from 'react'
import {StyleSheet, SectionList} from 'react-native'

import * as c from '../../components/colors'
import {ListSeparator, ListSectionHeader, ListFooter} from '../../components/list'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import {NoonNewsRowView} from './bulletin-row'
import moment from 'moment-timezone'
import qs from 'querystring'
import {toLaxTitleCase as titleCase} from 'titlecase'
import delay from 'delay'
import reduce from 'lodash/reduce'
import {
  parseHtml,
  cssSelect,
  getTrimmedTextWithSpaces as getText,
} from '../../../lib/html'
import type {TopLevelViewPropsType} from '../..types'

const CENTRAL_TZ = 'America/Winnipeg'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

const paragraphicalKeys = ['data']

function parseBulletinsFromDom(dom: mixed): any {
  const bulletinRows = cssSelect('td > p', dom,)
  const sections = cssSelect('a > b > u', bulletinRows,).map(getText)
  const entries = bulletinRows.map(getText)
  const rawEntries = bulletinRows

  return {
    bulletins: rawEntries,
    sections: sections,
  }

  //const groupedByTerm: {[key: string]: CourseType[]} = {}

  // explicitly say that this is `any` because it should immediately become a string
  // let currentTerm: any = null
  // for (let row of courseRows) {
  //   // console.log(row)
  //   if (includes(row.attribs.class, 'sis-termheader')) {
  //     currentTerm = getText(row)
  //     groupedByTerm[currentTerm] = groupedByTerm[currentTerm] || []
  //   } else {
  //     let course = rowToCourse(row, currentTerm)
  //     groupedByTerm[currentTerm].push(course)
  //   }
  // }
  //return groupedByTerm
}

export class NoonNewsView extends React.PureComponent {
  props: TopLevelViewPropsType & {
    name: string,
    url: string,
    onRefresh: () => any,
    entries: StoryType[],
    loading: boolean,
  }

  state: {
    error: ?Error,
    loaded: boolean,
    noBulletins: boolean,
    refreshing: boolean,
    sections: Array<string>,
    bulletins: Array<{title: string, data: Array<BulletinType>}>,
  } = {
    error: null,
    loaded: false,
    noBulletins: false,
    refreshing: false,
    sections: [],
    bulletins: [],
  }

  componentWillMount() {
    this.getData()
  }

  getData = async () => {
    //try {
      this.setState(() => ({refreshing: true}))

      const date = moment.tz(CENTRAL_TZ)
      const today = date.format('YYYY-MM-DD')

      let params = {
        thedate: today,
      }

      const noonNewsURL = `${this.props.url}?${qs.stringify(params)}`
      const page = await fetch(noonNewsURL).then(r => r.text())
      const dom = parseHtml(page)
      const {bulletins, sections} = parseBulletinsFromDom(dom)

      bulletins.reduce((coll, listEl) => {
        let [key, ...value] = listEl.children
        //key = getText(key).replace(/:$/, '')

        console.log(listEl.children.map(value, console.log(value)))

        if (paragraphicalKeys.includes(key)) {
          value = cssSelect('p', listEl).map(getText).join('\n\n').trim()
        } else {
          value = getText(value).trim()
        }

        coll.set(key, value)

        return coll
      }, new Map())

      //console.log(detailMap)

      // if (bulletins.length < 1) {
      //   this.setState(() => ({noBulletins: true}))
      // }

      // force title-case on the stream types, to prevent not-actually-duplicate headings
      // const processed = streams
      //   .filter(stream => stream.category !== 'athletics')
      //   .map(stream => {
      //     const date = moment(stream.starttime, 'YYYY-MM-DD HH:mm')
      //     return {
      //       ...stream,
      //       category: titleCase(stream.category),
      //       date: date,
      //       $groupBy: date.format('dddd, MMMM Do'),
      //     }
      //   })

      // const grouped = groupBy(processed, j => j.$groupBy)
      // const mapped = toPairs(grouped).map(([title, data]) => ({title, data}))

      this.setState(() => ({
        error: null,
        loaded: true,
        refreshing: false,
        sections: sections,
        bulletins: bulletins,
      }))
    // } catch (error) {
    //   this.setState(() => ({error: error.message}))
    //   console.warn(error)
    // }
  }

  onPressNews = (story: StoryType) => {
    this.props.navigation.navigate('NoonNewsRowView', {
      story,
    })
  }

  // keyExtractor = (item: StoryType) => item.title
  keyExtractor = (item: StoryType) => item

  //renderSectionHeader = ({section: {title}}: any) => {
  renderSectionHeader = (title: any) =>
    <ListSectionHeader title={title} />

  renderItem = ({item}: {item: StoryType}) =>
    <NoonNewsRowView
      onPress={this.onPressNews}
      story={item}
    />

  render() {
    if (!this.state.loaded) {
      return <LoadingView />
    }

    if (this.state.error) {
      return <NoticeView text={'Error: ' + this.state.error.message} />
    }

    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListFooterComponent={
          <ListFooter
            title={
              'Powered by the Carleton Noon News Bulletin'
            }
          />
        }
        style={styles.listContainer}
        sections={(this.state.sections: any)}
        keyExtractor={this.keyExtractor}
        renderSectionHeader={this.renderSectionHeader}
        renderItem={this.renderItem}
        refreshing={this.state.refreshing}
        onRefresh={this.props.onRefresh}
      />
    )
  }
}
