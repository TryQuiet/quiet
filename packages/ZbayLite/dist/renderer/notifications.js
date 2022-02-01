"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayDirectMessageNotification = exports.createNotification = void 0;
/* global Notification */
const sounds_1 = require("../shared/sounds");
const electronStore_1 = __importDefault(require("../shared/electronStore"));
const history_1 = __importDefault(require("../shared/history"));
const createNotification = ({ title, body, data }) => __awaiter(void 0, void 0, void 0, function* () {
    const sound = parseInt(electronStore_1.default.get('notificationCenter.user.sound'));
    if (sound) {
        yield sounds_1.soundTypeToAudio[sound].play();
    }
    const notification = new Notification(title, { body: body });
    notification.onclick = () => {
        history_1.default.push(data);
    };
    return notification;
});
exports.createNotification = createNotification;
const displayDirectMessageNotification = ({ message, username }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!message || !message.message) {
        return;
    }
    return yield (0, exports.createNotification)({
        title: `New message from ${username || 'Unnamed'}`,
        body: `${message.message.substring(0, 64)}${message.message.length > 64 ? '...' : ''}`,
        data: `/main/direct-messages/${username}`
    });
});
exports.displayDirectMessageNotification = displayDirectMessageNotification;
exports.default = {
    createNotification: exports.createNotification
};
