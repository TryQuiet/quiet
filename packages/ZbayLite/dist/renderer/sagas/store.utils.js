"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectReducer = exports.selectorsFactory = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const selectorsFactory = (storeKey, ReducerState) => {
    const reducerSelector = (store) => store[storeKey];
    const reducerKeys = Object.keys(new ReducerState());
    // @ts-expect-error
    const createdSelectors = {};
    return reducerKeys.reduce((accumulator, key) => {
        accumulator[key] = (0, toolkit_1.createSelector)(reducerSelector, (state) => state[key]);
        return accumulator;
    }, createdSelectors);
};
exports.selectorsFactory = selectorsFactory;
const selectReducer = (storeKey) => {
    return (store) => {
        return store[storeKey];
    };
};
exports.selectReducer = selectReducer;
