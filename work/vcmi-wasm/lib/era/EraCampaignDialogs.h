/* Source campaign IF dialog contracts; GPL-2.0-or-later. */
#pragma once
#include "EraCampaignJson.h"
VCMI_LIB_NAMESPACE_BEGIN
namespace era_campaign_dialogs
{
using namespace ::era_campaign;
class Dialogs
{
 JsonNode & definitions;
 State & vm;
 const Context & context;
 int number(const Operand & operand)const{return readNumber(operand,vm,context);}
 std::string cell(const Operand & operand)const
 {if(operand.kind==Kind::Default)return {};return formatText(lookup(vm.z,number(operand)),vm,context);}
 std::string text(const Operand & operand)const
 {return textOperand(operand,vm)?readText(operand,vm,context):lookup(vm.z,number(operand));}
 static void require(bool condition,const char * message)
 {if(!condition)throw std::runtime_error(message);}
 JsonNode & definition(int id)
 {require(id>=1&&id<=100,"Invalid campaign dialog number");return definitions[std::to_string(id)];}
 static void arity(const Operation & operation,std::size_t size)
 {require(operation.args.size()==size,"Invalid campaign dialog arity");}
 JsonNode base(const std::string & kind,const std::string & message)const
 {
  JsonNode pending;pending["contract"].String()="source-campaign-dialog-v1";
  pending["kind"].String()=kind;pending["text"].String()=message;return pending;
 }
public:
 Dialogs(JsonNode & definitions,State & state,const Context & context):definitions(definitions),vm(state),context(context){}
 // null means definition only; a populated result suspends the real VM.
 JsonNode execute(const Operation & operation)
 {
  const auto & args=operation.args;
  if(operation.code=="D")
  {
   arity(operation,16);auto & dialog=definition(number(args[0]));
   dialog["title"].String()=cell(args[1]);dialog["inputLabel"].String()=cell(args[2]);dialog["choiceLabel"].String()=cell(args[3]);
   dialog["pictures"].Vector().clear();dialog["choices"].Vector().clear();dialog["hints"].Vector().clear();dialog["canCancel"].Bool()=true;
   for(int i=0;i<4;++i)
   {
    JsonNode picture;picture["file"].String()=cell(args[4+i]);picture["hint"].String()=cell(args[8+i]);dialog["pictures"].Vector().push_back(picture);
    JsonNode choice;choice["value"].Integer()=i+1;choice["label"].String()=cell(args[12+i]);dialog["choices"].Vector().push_back(choice);dialog["hints"].Vector().push_back(choice["label"]);
   }
   return {};
  }
  if(operation.code=="F")
  {
   arity(operation,6);auto & dialog=definition(number(args[0]));dialog["hints"].Vector().clear();
   for(int i=1;i<=4;++i)dialog["hints"].Vector().push_back(JsonNode(cell(args[i])));
   dialog["canCancel"].Bool()=number(args[5])!=0;return {};
  }
  if(operation.code=="E")
  {
   arity(operation,2);const int target=number(args[0]);require(target>=1&&target<=10000,"Invalid campaign dialog result variable");
   const auto & dialog=definition(number(args[1]));require(dialog["title"].isString(),"Campaign dialog shown before definition");
   auto pending=base("extended",dialog["title"].String());pending["resultVariable"].Integer()=target;
   pending["inputLabel"]=dialog["inputLabel"];pending["choiceLabel"]=dialog["choiceLabel"];pending["pictures"]=dialog["pictures"];
   pending["canCancel"].Bool()=dialog["canCancel"].isNull()||dialog["canCancel"].Bool();pending["choices"].Vector();
   for(std::size_t i=0;i<dialog["choices"].Vector().size();++i)
   {
    auto choice=dialog["choices"].Vector()[i];if(choice["label"].String().empty())continue;
    if(i<dialog["hints"].Vector().size())choice["hint"]=dialog["hints"].Vector()[i];pending["choices"].Vector().push_back(choice);
   }
   return pending;
  }
  if(operation.code=="G")
  {
   require(args.size()>=5&&args.size()<=16,"Invalid campaign checklist arity");
   const int target=number(args[1]);require(target>=1&&target<=10000,"Invalid campaign checklist result variable");
   auto pending=base("checklist",cell(args[3]));pending["resultVariable"].Integer()=target;pending["multiple"].Bool()=number(args[0])==0;
   pending["initial"].Integer()=number(args[2]);pending["canCancel"].Bool()=false;pending["choices"].Vector();
   for(std::size_t i=4;i<args.size();++i)if(number(args[i])!=0)
   {JsonNode choice;choice["value"].Integer()=1<<(i-4);choice["label"].String()=cell(args[i]);pending["choices"].Vector().push_back(choice);}
   return pending;
  }
  if(operation.code=="M"){arity(operation,1);return base("message",text(args[0]));}
  if(operation.code=="Q")
  {
   require(args.size()==2||args.size()==5||args.size()==7||args.size()==9,"Invalid campaign question arity");
   const int type=args.size()==2?2:number(args[args.size()-2]);require(type==1||type==2||type==7||type==10,"Unadmitted campaign question mode");
   auto pending=base(type==1?"message":type==2?"question":"pictures",text(args.back()));
   if(type==2||type==7)pending["flag"].Integer()=number(args[0]);
   if(type==10)pending["resultVariable"].Integer()=number(args[0]);
   pending["pictureMode"].Integer()=type;pending["pictures"].Vector();
   if(args.size()>2)for(std::size_t i=1;i+2<args.size();i+=2)
   {JsonNode picture;picture["type"].Integer()=number(args[i]);picture["subtype"].Integer()=number(args[i+1]);pending["pictures"].Vector().push_back(picture);}
   if(type==7||type==10)require(pending["pictures"].Vector().size()>=2,"Campaign picture choice needs two pictures");
   pending["canCancel"].Bool()=type==2||type==10;return pending;
  }
  throw std::runtime_error("Unsupported source campaign IF dialog operation "+operation.code);
 }
 void reply(const JsonNode & pending,int selection,const std::string & entered)
 {
  require(entered.size()<=2048&&entered.find('\0')==std::string::npos,"Invalid campaign text answer");
  const auto & kind=pending["kind"].String();
  if(kind=="extended")
  {
   bool allowed=selection==0&&pending["choices"].Vector().empty();
   for(const auto & choice:pending["choices"].Vector())allowed|=choice["value"].Integer()==selection;
   allowed|=selection==-1&&pending["canCancel"].Bool();require(allowed,"Invalid extended campaign choice");
   vm.v[era_campaign_json::integer(pending["resultVariable"])]=selection;
   vm.z[1]=pending["inputLabel"].String().empty()?std::string():entered;return;
  }
  if(kind=="checklist")
  {
   int mask=0;for(const auto & choice:pending["choices"].Vector())mask|=era_campaign_json::integer(choice["value"]);
   require(selection>=0&&(selection&~mask)==0,"Invalid campaign checklist mask");
   require(pending["multiple"].Bool()||selection==0||(selection&(selection-1))==0,"Multiple choices in a single-choice campaign dialog");
   vm.v[era_campaign_json::integer(pending["resultVariable"])]=selection;return;
  }
  if(kind=="pictures")
  {
   const int type=era_campaign_json::integer(pending["pictureMode"]);
   if(type==7){require(selection==0||selection==1,"Invalid campaign picture answer");writeFlag(era_campaign_json::integer(pending["flag"]),vm,selection==1);}
   else{require(selection>=0&&selection<=2,"Invalid campaign picture answer");vm.v[era_campaign_json::integer(pending["resultVariable"])]=selection;}
   return;
  }
  if(kind=="question")
  {require(selection==0||selection==1,"Invalid campaign yes/no answer");writeFlag(era_campaign_json::integer(pending["flag"]),vm,selection==1);return;}
  require(kind=="message"&&selection==1,"Invalid campaign message acknowledgement");
 }
};
}
VCMI_LIB_NAMESPACE_END
