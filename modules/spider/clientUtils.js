function closeDialog(selector) {
	__utils__.echo('------------------closing dialog-----------');
	var A = AUI().use('widget');
	var dialog = A.Widget.getByNode(selector);

	if (dialog) {
		dialog.hide();
	}
};

function getDialogId(selector) {
	var A = AUI().use('widget');
	var dialog = A.Widget.getByNode(selector);
	if (dialog) {
		return dialog.get('id');
	}
	return null;
};

function getLinks(selector, domain) {
	var links = [];

	var list = __utils__.findAll(selector);

	Array.prototype.forEach.call(list, function(item) {
		var obj = {};
		var id = item.id;

		obj.url = item.href;
		obj.selector = getSelector(item);

		if (id && id.indexOf('yui_patched') != 0) {
			obj.name = '#' + id;
		}
		else {
			obj.name = item.textContent.trim().replace('/', '-');
		}

		// delete -> removing portlet
		// remove -> removing sites
		// unsubscribe -> messageboards, articles
		// active/deactive -> app manager
		if  ( (obj.url && ( (obj.url.indexOf(domain) != 0 && obj.url.indexOf('javascript') == -1) 
				|| obj.url.indexOf('logout') > -1 || obj.url.indexOf('languageId') > -1 || obj.url.indexOf('remove') > -1 
				|| obj.url.indexOf('unsubscribe') > -1 || obj.url.indexOf('delete') > -1 )) 
				|| obj.name.indexOf('Return to Full Page') > -1 || obj.name.indexOf('Delete') > -1
				|| item.className.indexOf('activate') > -1 || item.className.indexOf('deactivate') > -1
			) 
		{
		}
		else {
			links.push(obj);
		}
	});

	return links;
};

function isVisible(element) {
	return AUI().Selector.pseudos.visible(element);
};