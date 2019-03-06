import {Action, Dispatch} from 'redux';
import {getFetchData} from '.';
import {IToDo} from '../interfaces/todo';
import {RemapActionCreators} from '../lib/actionTools';
import {getEtagHeader, IEtagData, wrapEtag} from '../lib/etagTools';
import {IReduxState, ThunkResult, Types} from '../reducers';
import {AppAction} from '../reducers/appReducer';

// dispatch actions
const setAppLoadingAction = (state: boolean): AppAction => {
	if (state) {
		return {type: Types.app.LOADING};
	} else {
		return {type: Types.app.LOADING_DONE};
	}
};

const setValueAction = (todo: IEtagData<IToDo>): AppAction => {
	return {type: Types.app.APP_SET_VALUE, todo};
};
const setErrorAction = (error: string): AppAction => {
	return {type: Types.app.APP_SET_ERROR, error};
};

const clearErrorAction = (): AppAction => {
	return {type: Types.app.APP_CLEAR_ERROR};
};
const setLoginAction = (): AppAction => {
	return {type: Types.app.LOGIN};
};
const setLogoutAction = (): AppAction => {
	return {type: Types.app.LOGOUT};
};

// async functions
export const getHome = (): ThunkResult<Promise<Action | void>> => (dispatch: Dispatch, getState: () => IReduxState) => {
	const state = getState();
	const headers = new Headers();
	if (state.app.todo && state.app.todo.etag) {
		headers.set('if-none-match', state.app.todo.etag);
	}
	dispatch(setAppLoadingAction(true));
	return fetch('https://jsonplaceholder.typicode.com/todos/1', {headers})
		.then(
			async (res): Promise<Action | void> => {
				dispatch(setAppLoadingAction(false));
				const todo = await getFetchData<IToDo>(res, dispatch, setLogoutAction);
				if (todo) {
					return Promise.resolve(dispatch(setValueAction(wrapEtag<IToDo>(todo, getEtagHeader(res)))));
				}
			},
		)
		.catch((error: Error) => {
			return Promise.reject(dispatch(setErrorAction(error.message)));
		});
};

export const doLogin = (username: string, password: string): ThunkResult<Promise<Action>> => (dispatch: Dispatch) => {
	dispatch(clearErrorAction());
	if (username === 'test' && password === 'password') {
		return Promise.resolve(dispatch(setLoginAction()));
	} else {
		return Promise.reject(dispatch(setErrorAction('account or password not match')));
	}
};

export const doLogout = (): ThunkResult<Promise<Action>> => (dispatch: Dispatch) => {
	return Promise.resolve(dispatch(setLogoutAction()));
};

// build action mapper for redux
const AppDispatchPropsMap = {
	doLogin,
	doLogout,
	getHome,
};
export type IActionDispatch = RemapActionCreators<typeof AppDispatchPropsMap>;
