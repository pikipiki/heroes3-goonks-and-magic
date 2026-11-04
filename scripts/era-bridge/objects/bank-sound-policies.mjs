/** TUM's ERA JSON null is absent, not an empty-string mute. Other origins stay strict. */
export const tumNullEnterSoundEvidence=Object.freeze({
 eraTranslations:'ERA Trans.pas commit8c2fd47b22b1e67c980f42583a525d36fc318364 LoadLangData.ProcessBox excludes Json.jsNull (l217); tr returns the key when absent (l118..130). SHA2566be845c5bf96792c95a72ec0f568f906e4f50a12bd9f960a5e9a0e2db5edd192',
 sourceHook:'h3era-plugins commit99e949d9d910556e57d19914b41976d5a07da577 SoundManager.cpp l272..306: override only when EraJS::read success; eraJson.hpp l51..55 success means translated text differs from key',
 shippedHook:'RMG_CustomizeObjectProperties.dll SHA2560a44dc321ac59c4df280a005906b70f6829be1ab7b08584cec4b5a62f80e1031 0x100108E0..0x10010A42: absent/equal-key result returns EXEC_DEFAULT; explicit empty translated string suppresses default',
 originalFallback:'h3era.exe SHA256451e208cb2985bca75330f0e3c52f89f9219c0c3701bc6e1f354217890c36181 0x4AA757 calls0x4AB100; object16 dispatch0x4AB65C[14]=8 ->0x4AB21D uses0x677854="Rogue.wav"; native VCMI config/objects/creatureBanks.json base.sounds.visit=["ROGUE"]',
});
export function resolveTumNullEnterSound(key){return key==='enter'?{mode:'inherit',evidence:Object.values(tumNullEnterSoundEvidence).join('; ')}:undefined;}
