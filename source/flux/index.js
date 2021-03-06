// @flow

import {createStore, applyMiddleware, combineReducers} from 'redux'
import {createLogger} from 'redux-logger'
import reduxPromise from 'redux-promise'
import reduxThunk from 'redux-thunk'

import {app, type State as AppState} from './parts/app'
import {balances, type State as BalancesState} from './parts/balances'
import {buildings, type State as BuildingsState} from './parts/buildings'
import {courses, type State as CoursesState} from './parts/courses'
import {help, type State as HelpState} from './parts/help'
import {homescreen, type State as HomescreenState} from './parts/homescreen'
import {menus, type State as MenusState} from './parts/menus'
import {settings, type State as SettingsState} from './parts/settings'

export {init as initRedux} from './init'
export {updateMenuFilters} from './parts/menus'

export type ReduxState = {
	app?: AppState,
	balances?: BalancesState,
	buildings?: BuildingsState,
	courses?: CoursesState,
	help?: HelpState,
	homescreen?: HomescreenState,
	menus?: MenusState,
	settings?: SettingsState,
}

export const makeStore = () => {
	const aao: any = combineReducers({
		app,
		balances,
		buildings,
		courses,
		help,
		homescreen,
		menus,
		settings,
	})

	const middleware = [reduxPromise, reduxThunk]

	if (__DEV__) {
		const logger = createLogger({
			collapsed: true,
			duration: true,
			// avoid logging the (large) course data state twice per action
			stateTransformer: state => ({
				...state,
				courses: {...state.courses, allCourses: '<omitted>'},
			}),
		})
		middleware.push(logger)
	}

	return createStore(aao, applyMiddleware(...middleware))
}
