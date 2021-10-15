import {
// <*REDUX_TYPES snippet=' {{ name }},' overwrite>
 USER_CREATE,
 USER_UPDATE,
 USER_FETCH,
 USER_DESTROY,
 USER_FETCH_ERROR,
 USER_TRIAL_UPDATE,
 USER_READY,
 USER_DELIGHTED,
 USER_ON_FIRE,
 USER_WOO,
 USER_FOO,
 USER_BAR,
 USER_BIM,
 USER_LEE,
// </*REDUX_TYPES>
} from "../types"

// <*REDUX_TYPES snippet='export const action{{ capitalise name }} = (data) => ({ type: {{ name }}, data })' overwrite>
export const actionUser_create = (data) => ({ type: USER_CREATE, data })
export const actionUser_update = (data) => ({ type: USER_UPDATE, data })
export const actionUser_fetch = (data) => ({ type: USER_FETCH, data })
export const actionUser_destroy = (data) => ({ type: USER_DESTROY, data })
export const actionUser_fetch_error = (data) => ({ type: USER_FETCH_ERROR, data })
export const actionUser_trial_update = (data) => ({ type: USER_TRIAL_UPDATE, data })
export const actionUser_ready = (data) => ({ type: USER_READY, data })
export const actionUser_delighted = (data) => ({ type: USER_DELIGHTED, data })
export const actionUser_on_fire = (data) => ({ type: USER_ON_FIRE, data })
export const actionUser_woo = (data) => ({ type: USER_WOO, data })
export const actionUser_foo = (data) => ({ type: USER_FOO, data })
export const actionUser_bar = (data) => ({ type: USER_BAR, data })
export const actionUser_bim = (data) => ({ type: USER_BIM, data })
export const actionUser_lee = (data) => ({ type: USER_LEE, data })
// </*REDUX_TYPES>