#pragma once
namespace era_bridge
{
// Typed constructor arguments normalize base pointers BEFORE storage; no unitID
// reuse/stale global map. Nested physical actions restore their outer frame.
template<class Actor,class Target> class Source241AttackFrame
{
 inline static thread_local Source241AttackFrame * current=nullptr;
 Source241AttackFrame * old;
 const Actor * actor;const Target * target;bool lateConsumed=false;
public:
 Source241AttackFrame(const Actor * a,const Target * t):old(current),actor(a),target(t){current=this;}
 ~Source241AttackFrame(){current=old;}
 Source241AttackFrame(const Source241AttackFrame &)=delete;
 Source241AttackFrame & operator=(const Source241AttackFrame &)=delete;
 static bool handles(const Actor * actor,const Target * target)
 {return current&&current->actor==actor&&current->target==target;}
 static bool consumeLate(const Actor * actor,const Target * target)
 {
     if(!handles(actor,target)||current->lateConsumed)return false;
     current->lateConsumed=true;return true;
 }
};
}
