// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../components/markdown'
import {ListFooter} from '../components/list'
import glamorous from 'glamorous-native'
import type {WordType} from './types'

// TODO: This doesn't point at the SA dictionary because they don't have an
// overview page.
const STO_SA_DICT_URL = 'https://github.com/carls-app/carls/issues/new'

const Term = glamorous.text({
  fontSize: 36,
  textAlign: 'center',
  marginHorizontal: 18,
  marginVertical: 10,
})

const Container = glamorous.scrollView({
  paddingHorizontal: 18,
  paddingVertical: 6,
})

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
  },
})

type Props = {
  navigation: {state: {params: {item: WordType}}},
}

export class DictionaryDetailView extends React.PureComponent<Props> {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.item.word,
    }
  }

  render() {
    const item = this.props.navigation.state.params.item
    return (
      <Container>
        <Term selectable={true}>{item.word}</Term>
        <Markdown
          styles={{Paragraph: styles.paragraph}}
          source={item.definition}
        />

        <ListFooter
          title="Collected by the humans of CARLS"
          href={STO_SA_DICT_URL}
        />
      </Container>
    )
  }
}
