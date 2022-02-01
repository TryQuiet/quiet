"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toolkit_1 = require("@reduxjs/toolkit");
const reducers_1 = require("../store/reducers");
const rootReducer = (0, toolkit_1.combineReducers)(reducers_1.reducers);
const store = (0, toolkit_1.configureStore)({ reducer: rootReducer });
