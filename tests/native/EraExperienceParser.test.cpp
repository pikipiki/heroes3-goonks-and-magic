#include <initializer_list>
#include <cassert>
#include <cstdio>
int main()
{
    double parsed=0;
    double factor=.1;
    for(int digit:{7,5}) { parsed+=factor*digit;factor/=10; }
    assert(parsed!=.75);
    assert(static_cast<float>(parsed)==.75f);
    std::printf("VCMIdecimal75=%.17g; sourcefloat32=%.9g\n",parsed,double(static_cast<float>(parsed)));
}
