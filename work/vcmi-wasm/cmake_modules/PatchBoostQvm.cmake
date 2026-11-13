# Boost QVM upstream c4b9c063a076644575fe9a685c02cd4c10d24405.
# Boost1.86 uses a template disambiguator on two non-template calls;
# Clang shipped with Emscripten4.0.23 rejects that syntax.
if(NOT DEFINED BOOST_SOURCE_DIR)
    message(FATAL_ERROR "BOOST_SOURCE_DIR is required")
endif()
set(header "${BOOST_SOURCE_DIR}/libs/qvm/include/boost/qvm/quat_traits.hpp")
file(READ "${header}" original)
string(REGEX MATCHALL "quat_traits<Q>::template write_element_idx" matches "${original}")
list(LENGTH matches count)
if(count EQUAL 2)
    string(REPLACE "quat_traits<Q>::template write_element_idx"
                   "quat_traits<Q>::write_element_idx" patched "${original}")
    file(WRITE "${header}" "${patched}")
elseif(NOT count EQUAL 0)
    message(FATAL_ERROR "Unexpected Boost QVM patch context")
endif()
