#include <csignal>
#include <cstdio>
#include <string>
#include <vector>
#include "embedded-node.h"

static volatile sig_atomic_t received = 0;
static void frontendSignal(int) { received = 1; }

int main() {
  struct sigaction action{};
  action.sa_handler = frontendSignal;
  sigemptyset(&action.sa_mask);
  sigaction(SIGUSR1, &action, nullptr);
  char executable[] = "node";
  char eval[] = "-e";
  char script[] = "process.kill(process.pid, 'SIGUSR1'); setTimeout(() => {}, 10)";
  char* args[] = {executable, eval, script};
  const int code = runEmbeddedNode(3, args);
  struct sigaction after{};
  sigaction(SIGUSR1, nullptr, &after);
  if (code != 0 || !received || after.sa_handler != frontendSignal) {
    fprintf(stderr, "FAIL: embedded Node replaced the frontend GC signal handler\n");
    return 1;
  }
  puts("PASS: frontend signal handler survives Node startup and execution");
}
