// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import {BuildingRow} from './row'
import {tracker} from '../../analytics'

import type momentT from 'moment'
import type {TopLevelViewPropsType} from '../types'
import type {BuildingType} from './types'

import {ListSeparator, ListSectionHeader, ListFooter} from '../components/list'
import * as c from '../components/colors'

export {BuildingHoursDetailView} from './detail'

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
  },
})

type Props = TopLevelViewPropsType & {
  now: momentT,
  loading: boolean,
  onRefresh: () => any,
  buildings: Array<{title: string, data: BuildingType[]}>,
}

export class BuildingHoursList extends React.PureComponent<Props> {
  onPressRow = (data: BuildingType) => {
    tracker.trackEvent('building-hours', data.name)
    this.props.navigation.navigate('BuildingHoursDetailView', {building: data})
  }

  keyExtractor = (item: BuildingType) => item.name

  renderSectionHeader = ({section: {title}}: any) => (
    <ListSectionHeader title={title} />
  )

  renderItem = ({item}: {item: BuildingType}) => (
    <BuildingRow
      name={item.name}
      info={item}
      now={this.props.now}
      onPress={this.onPressRow}
    />
  )

  render() {
    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListFooterComponent={
          <ListFooter
            title={
              'Building hours subject to change without notice\n\nData collected from SaylesHill.xyz'
            }
          />
        }
        sections={(this.props.buildings: any)}
        extraData={this.props}
        keyExtractor={this.keyExtractor}
        renderSectionHeader={this.renderSectionHeader}
        renderItem={this.renderItem}
        contentContainerStyle={styles.container}
        refreshing={this.props.loading}
        onRefresh={this.props.onRefresh}
      />
    )
  }
}
