// @flow

import React from 'react'
import {View, Text} from 'react-native'
import {Column, Row} from '../../components/layout'
import {ListRow, Detail, Title} from '../../components/list'

export class NoonNewsRowView extends React.PureComponent {
  props: {
    onPress: StoryType => any,
    story: StoryType,
  }

  _onPress = () => this.props.onPress(this.props.story)

  render() {
    const {story} = this.props

    return (
      <ListRow onPress={this._onPress} arrowPosition="top">
        <Row alignItems="center">
          <Column flex={1}>
            <Title lines={3}>{story}</Title>
          </Column>
        </Row>
      </ListRow>
    )
  }
}
