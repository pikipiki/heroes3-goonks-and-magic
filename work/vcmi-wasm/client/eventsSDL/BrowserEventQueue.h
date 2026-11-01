#pragma once
#include <cstddef>
#include <mutex>

namespace browser_input
{
// The browser must stay available to service worker proxies. Dispatch owns the
// interface mutex, so callbacks must not acquire that same mutex recursively.
template<typename Queue, typename Mutex, typename Dispatch>
std::size_t drain(Queue & pending, Mutex & interfaceMutex, Dispatch dispatch, std::size_t budget=64)
{
 std::size_t consumed=0;
 while(consumed<pending.size()&&consumed<budget)
 {
  std::unique_lock<Mutex> lock(interfaceMutex,std::try_to_lock);
  if(!lock.owns_lock())break;
  dispatch(pending[consumed]);
  ++consumed;
 }
 pending.erase(pending.begin(),pending.begin()+consumed);
 return consumed;
}
}
