// @flow

import './globalize-fetch'
import './setup-moment'

import * as React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {makeStore, initRedux} from './flux'
import bugsnag from './bugsnag'
import {tracker} from './analytics'
import {AppNavigator} from './navigation'
import type {NavigationState} from 'react-navigation'
import {Provider as PaperProvider} from 'react-native-paper'

const store = makeStore()
initRedux(store)

// gets the current screen from navigation state
function getCurrentRouteName(navigationState: NavigationState): ?string {
	if (!navigationState) {
		return null
	}
	const route = navigationState.routes[navigationState.index]
	// dive into nested navigators
	if (route.routes) {
		return getCurrentRouteName(route)
	}
	return route.routeName
}

type Props = {}

export default class App extends React.Component<Props> {
	trackScreenChanges(
		prevState: NavigationState,
		currentState: NavigationState,
	) {
		const currentScreen = getCurrentRouteName(currentState)
		const prevScreen = getCurrentRouteName(prevState)

		if (!currentScreen) {
			return
		}

		if (currentScreen !== prevScreen) {
			tracker.trackScreenView(currentScreen)
			bugsnag.leaveBreadcrumb(currentScreen.substr(0, 30), {
				type: 'navigation',
				previousScreen: prevScreen,
			})
		}
	}

	render() {
		return (
			<ReduxProvider store={store}>
				<PaperProvider>
					<AppNavigator onNavigationStateChange={this.trackScreenChanges} />
				</PaperProvider>
			</ReduxProvider>
		)
	}
}
