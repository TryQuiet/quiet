#pragma once

#include "node.h"
#include <cstdio>
#include <string>
#include <vector>

// Android hosts Node alongside JavaScriptCore. The standalone Node entry point
// installs a SIGUSR1 debugger handler, replacing JavaScriptCore's GC handler.
// Use the embedder API so the backend never owns the frontend's process signals.
inline int runEmbeddedNode(int argc, char* argv[]) {
  auto initialization = node::InitializeOncePerProcess(
      std::vector<std::string>(argv, argv + argc),
      {node::ProcessInitializationFlags::kNoDefaultSignalHandling,
       node::ProcessInitializationFlags::kNoStdioInitialization});
  for (const auto& error : initialization->errors())
    fprintf(stderr, "Node initialization: %s\n", error.c_str());
  if (initialization->early_return()) return initialization->exit_code();

  int exitCode = 1;
  {
    std::vector<std::string> errors;
    const auto flags = static_cast<node::EnvironmentFlags::Flags>(
        node::EnvironmentFlags::kOwnsProcessState |
        node::EnvironmentFlags::kTrackUnmanagedFds);
    auto setup = node::CommonEnvironmentSetup::Create(
        initialization->platform(), &errors, initialization->args(),
        initialization->exec_args(), flags);
    for (const auto& error : errors)
      fprintf(stderr, "Node environment: %s\n", error.c_str());
    if (setup) {
      auto* isolate = setup->isolate();
      v8::Locker locker(isolate);
      v8::Isolate::Scope isolateScope(isolate);
      v8::HandleScope handleScope(isolate);
      v8::Context::Scope contextScope(setup->context());
      // Empty callback selects the normal Node entry point, including argv,
      // CommonJS/ESM loading and the registered React Native bridge module.
      if (!node::LoadEnvironment(setup->env(), node::StartExecutionCallback{}).IsEmpty())
        exitCode = node::SpinEventLoop(setup->env()).FromMaybe(1);
    }
  }
  node::TearDownOncePerProcess();
  return exitCode;
}
