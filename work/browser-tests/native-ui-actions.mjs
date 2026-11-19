// Follow the same visible overflow menus as a touch/mouse player.
export async function revealNativeAction(page,selector,{mouse=false}={}){
 const action=page.locator(selector);
 await action.waitFor({state:'attached'});
 if(!await action.isVisible()){
  const menu=await action.evaluate(node=>node.closest('[role="menu"]')?.id);
  if(menu)await page.locator(`button[aria-controls="${menu}"]`)[mouse?'click':'tap']();
 }
 await action.waitFor({state:'visible'});return action;
}

export async function selectNativeOption(page,selector,value,{mouse=false}={}){
 const source=page.locator(selector);await source.waitFor({state:'attached'});
 if(await source.isVisible()){await source.selectOption(String(value));return;}
 const trigger=page.locator(`${selector}+.material-select-host [role=combobox]`);
 await trigger[mouse?'click':'tap']();
 await page.locator(`[role=option][data-value="${value}"]`)[mouse?'click':'tap']();
 await page.waitForFunction(({selector,value})=>document.querySelector(selector)?.value===String(value),{selector,value});
}

// The common hero rail delegates its visible menu items to the native tabs.
export async function selectHeroTab(page,tab,{mouse=false}={}){
 const press=mouse?'click':'tap',selector=`[data-hero-tab="${tab}"]`,source=page.locator(selector);
 if(await source.isVisible()){await source[press]();return;}
 const rail=page.locator('[data-ui-hero-tabs]:visible');
 if(await rail.count()){
  await rail[press]();await page.locator(`[data-ui-hero-tab="${tab}"]:visible`)[press]();return;
 }
 await page.locator('.hero-bag-tabs .ui-overflow-trigger:visible')[press]();await source[press]();
}

export async function selectLobbyIncome(page,color,value,{mouse=false}={}){
 await page.locator(`[data-setting="income-${color}"] [data-tile-value="${value}"]`)[mouse?'click':'tap']();
 await page.waitForFunction(({color,value})=>document.querySelector(`[data-player-income="${color}"]`)?.value===String(value),{color,value});
}
