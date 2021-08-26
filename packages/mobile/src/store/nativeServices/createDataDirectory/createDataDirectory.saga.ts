import { NativeModules } from "react-native";
import { call } from "typed-redux-saga";

export function* createDataDirectorySaga(): Generator {
    yield* call(NativeModules.TorModule.createDataDirectory);
}
