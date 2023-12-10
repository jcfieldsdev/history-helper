chrome.action.onClicked.addListener(function() {
	chrome.tabs.create({url: "popup/history.html"});
});