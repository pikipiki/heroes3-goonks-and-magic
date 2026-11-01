/* SDL's Web Audio callback and all mixer operations share BrowserMain.
 * The Emscripten SDL backend intentionally has no device lock. */
#pragma once
#include <exception>
#include <optional>
#include <type_traits>
#include <utility>
#ifdef VCMI_EMSCRIPTEN
#include <emscripten/proxying.h>
#include <emscripten/threading.h>
#include <SDL_error.h>
#include <string>
#include <stdexcept>
#endif
namespace web_audio
{
#ifdef VCMI_EMSCRIPTEN
inline em_proxying_queue * queue()
{
    // Process-lifetime queue, outliving audio handlers during shutdown.
    static em_proxying_queue * instance=em_proxying_queue_create();
    return instance;
}
#endif
template<class F> struct Task
{
    using Result=std::invoke_result_t<F &>;
    using Stored=std::conditional_t<std::is_void_v<Result>,bool,Result>;
    F operation;
    std::optional<Stored> result;
    std::exception_ptr error;
    static void execute(void * raw) noexcept
    {
        auto & task=*static_cast<Task *>(raw);
        try
        {
            if constexpr(std::is_void_v<Result>){task.operation();task.result=true;}
            else task.result.emplace(task.operation());
        }
        catch(...){task.error=std::current_exception();}
    }
    Result finish()
    {
        if(error)std::rethrow_exception(error);
        if constexpr(!std::is_void_v<Result>)return std::move(result.value());
    }
};
template<class F> auto call(F operation)->std::invoke_result_t<F &>
{
#ifdef VCMI_EMSCRIPTEN
    if(!emscripten_is_main_runtime_thread())
    {
        // A dedicated queue: mixer/file operations are not signal-handler-safe
        // work and must not use Emscripten's low-level system queue.
        auto * audioQueue=queue();
        std::string errorText;
        auto withError=[&]() -> std::invoke_result_t<F &>
        {
            SDL_ClearError();
            if constexpr(std::is_void_v<std::invoke_result_t<F &>>)
            {operation();errorText=SDL_GetError();}
            else
            {auto result=operation();errorText=SDL_GetError();return result;}
        };
        Task<decltype(withError)> task{std::move(withError),{}, {}};
        if(!audioQueue || !emscripten_proxy_sync(audioQueue,emscripten_main_runtime_thread_id(),&decltype(task)::execute,&task))
            throw std::runtime_error("Web Audio task could not reach the runtime thread");
        // SDL errors are thread-local. Preserve the error associated with this
        // operation before another audio task runs on BrowserMain.
        if(!errorText.empty())SDL_SetError("%s",errorText.c_str());
        else SDL_ClearError();
        return task.finish();
    }
#endif
    return operation();
}
}
