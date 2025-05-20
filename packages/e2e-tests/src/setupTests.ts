/**
 * This gets rid of the awkward formatting that jest does to logs where it attaches useless
 * traces to every single log message and blows up the size of logs unnecessarily.
 */
import console from 'console'
global.console = console
