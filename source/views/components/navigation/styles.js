/**
 * @flow
 * A collection of common styles for navbar buttons
 */

import {StyleSheet, Platform} from 'react-native'

export const commonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        paddingVertical: 11,
        paddingHorizontal: 18,
      },
      android: {
        paddingVertical: 15.5,
        paddingHorizontal: 16,
      },
    }),
  },
  text: {
    fontSize: 17,
    color: 'white',
    ...Platform.select({
      android: {
        marginTop: 1,
      },
    }),
  },
})