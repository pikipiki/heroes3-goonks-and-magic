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
