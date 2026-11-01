#include "../../work/vcmi-wasm/client/media/AudioThread.h"
#include <cassert>
#include <thread>
#include <memory>
#include <stdexcept>
int main()
{
    assert(web_audio::call([]{return 42;})==42);
    int calls=0;web_audio::call([&]{++calls;});assert(calls==1);
    auto pointer=web_audio::call([]{return std::make_unique<int>(17);});assert(*pointer==17);
    auto operation=[]{return std::make_unique<int>(23);};
    web_audio::Task<decltype(operation)> task{operation,{}, {}};
    std::thread worker([&]{decltype(task)::execute(&task);});worker.join();
    assert(*task.finish()==23);
    auto fail=[]()->int{throw std::runtime_error("audio proxy failure");};
    web_audio::Task<decltype(fail)> broken{fail,{}, {}};
    std::thread throwing([&]{decltype(broken)::execute(&broken);});throwing.join();
    bool caught=false;try{(void)broken.finish();}catch(const std::runtime_error & error){caught=std::string(error.what())=="audio proxy failure";}assert(caught);
    auto noResult=[&]{++calls;};web_audio::Task<decltype(noResult)> voidTask{noResult,{}, {}};
    std::thread noReturn([&]{decltype(voidTask)::execute(&voidTask);});noReturn.join();voidTask.finish();assert(calls==2);
}
