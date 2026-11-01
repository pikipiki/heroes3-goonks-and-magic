#include "../../work/vcmi-wasm/client/eventsSDL/BrowserEventQueue.h"
#include <atomic>
#include <cassert>
#include <numeric>
#include <thread>
#include <vector>

int main()
{
 std::mutex interfaceMutex;
 std::atomic<bool> workerReady{false},browserServicedProxy{false};
 std::vector<int> pending{1,2,3},handled;
 std::thread worker([&]{
  std::scoped_lock lock(interfaceMutex);
  workerReady=true;
  while(!browserServicedProxy.load())std::this_thread::yield();
 });
 while(!workerReady.load())std::this_thread::yield();
 // A blocking lock here deadlocks: the worker cannot release until the browser
 // has returned from the drain and serviced its proxy.
 const auto blocked=browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);});
 assert(blocked==0&&handled.empty()&&pending==std::vector<int>({1,2,3}));
 browserServicedProxy=true;worker.join();
 assert(browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);},2)==2);
 assert(handled==std::vector<int>({1,2})&&pending==std::vector<int>({3}));
 assert(browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);})==1);
 assert(handled==std::vector<int>({1,2,3})&&pending.empty());
 pending.resize(150);std::iota(pending.begin(),pending.end(),0);handled.clear();
 assert(browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);})==64);
 assert(pending.size()==86&&pending.front()==64);
 browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);});
 browser_input::drain(pending,interfaceMutex,[&](int e){handled.push_back(e);});
 assert(pending.empty()&&handled.size()==150);
 for(int i=0;i<150;++i)assert(handled[i]==i);
}
