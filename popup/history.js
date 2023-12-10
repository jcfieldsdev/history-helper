/******************************************************************************
 * History Helper                                                             *
 *                                                                            *
 * Copyright (C) 2021 J.C. Fields (jcfields@jcfields.dev).                    *
 *                                                                            *
 * Permission to use, copy, modify, and/or distribute this software for any   *
 * purpose with or without fee is hereby granted, provided that the above     *
 * copyright notice and this permission notice appear in all copies.          *
 *                                                                            *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES   *
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF           *
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR    *
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES     *
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN      *
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR *
 * IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.                *
 ******************************************************************************/

"use strict";

/*
 * constants
 */

// subject types
const SUBJECT = {
	TITLE_OR_URL: 0,
	TITLE:        1,
	URL:          2,
	HOST:         3,
	PATH:         4,
	VISIT_COUNT:  5
};

// predicate types
const PREDICATE = {
	STRING: 0,
	NUMBER: 1
};

// string conditions
const STRING = {
	CONTAINS:            0,
	DOES_NOT_CONTAIN:    1,
	STARTS_WITH:         2,
	DOES_NOT_START_WITH: 3,
	ENDS_WITH:           4,
	DOES_NOT_END_WITH:   5
};

// number conditions
const NUMBER = {
	EQUAL_TO:                 0,
	NOT_EQUAL_TO:             1,
	LESS_THAN_OR_EQUAL_TO:    2,
	LESS_THAN:                3,
	GREATER_THAN_OR_EQUAL_TO: 4,
	GREATER_THAN:             5
};

// date ranges
const DATE_RANGE = {
	SPECIFIC_RANGE: 0,
	LAST_HOUR:      1,
	LAST_DAY:       2,
	LAST_WEEK:      3,
	LAST_MONTH:     4,
	LAST_YEAR:      5,
	ALL_TIME:       6
};

// sort criteria for results
const SORT_BY = {
	TITLE:        0,
	URL:          1,
	LAST_VISITED: 2,
	VISIT_COUNT:  3
};

// sort direction for results
const SORT_ORDER = {
	DESCENDING: false,
	ASCENDING:  true
};

// match states
const MATCH = {
	ANY: 0,
	ALL: 1
};

// default values
const DEFAULTS = {
	SUBJECT:     SUBJECT.TITLE_OR_URL,
	DATE_RANGE:  DATE_RANGE.LAST_WEEK,
	SORT_BY:     SORT_BY.LAST_VISITED,
	SORT_ORDER:  SORT_ORDER.DESCENDING,
	MATCH:       MATCH.ALL,
	MIN_RESULTS: 1,
	MAX_RESULTS: 4 // as power of 10
};

// date/time locale string options
const DATE_FORMAT = {
	dateStyle: "full",
	timeStyle: "medium"
};

// time zone offset in hours
const TZ_OFFSET = new Date().getTimezoneOffset() / 60;

/*
 * initialization
 */

window.addEventListener("load", function() {
	const rowCollection = new RowCollection();
	const form = new Form();
	const search = new Search(rowCollection);

	rowCollection.addRow(0);
	form.createRow(rowCollection.getRow(0));
	form.focusRow(0);

	form.init();

	chrome.storage.local.get().then(function(options) {
		if (Object.keys(options).length > 0) {
			form.load(options.form);
			search.load(options.search);
		}

		form.toggleOptions(true);
		form.reloadOptions(search);
	});

	window.addEventListener("beforeunload", function() {
		chrome.storage.local.set({
			form:   form.save(),
			search: search.save()
		});
	});
	document.addEventListener("keydown", function(event) {
		const {key} = event;

		if (key == "Enter") {
			form.loading();
			search.search().then(function(results) {
				form.showResults(results, search);
			});
		}
	});
	document.addEventListener("click", function(event) {
		const element = event.target;

		if (element.matches(".add")) {
			const n = Number(element.closest(".row").dataset.row);
			const row = rowCollection.getRow(n);
			form.createRow(row);
			rowCollection.addRow(n);
			form.focusRow(n + 1);
		}

		if (element.matches(".remove")) {
			const n = Number(element.closest(".row").dataset.row);
			form.deleteRow(n);
			rowCollection.removeRow(n);
			form.focusRow(n - 1);
		}

		if (element.matches(".match")) {
			search.match = Number(element.value);
			form.reloadOptions(search);
		}

		if (element.matches("#submit")) {
			form.loading();
			search.search().then(function(results) {
				form.showResults(results, search);
			});
		}

		if (element.matches(".clear")) {
			element.previousElementSibling.value = "";
			element.previousElementSibling.focus();
		}

		if (element.matches(".reset")) {
			search[element.value] = null;
			form.reloadOptions(search);
		}

		if (element.matches(".setDate")) {
			form.setDate(search, Number(element.value));
		}

		if (element.matches(".showVisits")) {
			form.showVisits(element.closest(".result"), element.value);
		}

		if (element.matches(".closeVisits")) {
			form.closeVisits(element.closest(".result"));
		}

		if (element.matches(".delete")) {
			form.deleteItem(element.closest(".result"), element.value);
		}
	});
	document.addEventListener("input", function(event) {
		const element = event.target;

		if (element.matches(".subject")) {
			const n = Number(element.closest(".row").dataset.row);
			const row = rowCollection.getRow(n);
			row.setSubject(Number(element.value));
			form.changePredicate(row);
			form.selectRow(n);
		}

		if (element.matches(".condition")) {
			const n = Number(element.closest(".row").dataset.row);
			rowCollection.getRow(n).condition = Number(element.value);
			form.selectRow(n);
		}

		if (element.matches(".query")) {
			const n = Number(element.closest(".row").dataset.row);
			rowCollection.getRow(n).value = element.value;
		}

		if (element.matches(".matchCase")) {
			const n = Number(element.closest(".row").dataset.row);
			const row = rowCollection.getRow(n);
			row.setFlag("matchCase", element.checked);
			form.focusRow(n);
		}

		if (element.matches(".matchWholeWord")) {
			const n = Number(element.closest(".row").dataset.row);
			const row = rowCollection.getRow(n);
			row.setFlag("matchWholeWord", element.checked);
			form.focusRow(n);
		}

		if (element.matches(".date")) {
			const date = element.closest(".dateRange").querySelector(".date");
			search[element.id] = date.value;
		}

		if (element.matches(".number")) {
			const n = Number(element.closest(".row").dataset.row);
			rowCollection.getRow(n).value = Number(element.value);
		}

		if (element.matches("#sortBy")) {
			const value = Number(element.value);
			form.sortBy = value;
			form.sortOrder = value == SORT_BY.TITLE || value == SORT_BY.URL;

			form.reloadOptions(search);
		}

		if (element.matches("#sortOrder")) {
			form.sortOrder = element.checked;
			form.reloadOptions(search);
		}

		if (element.matches("#dateRange")) {
			search.dateRange = Number(element.value);
			form.reloadOptions(search);
		}

		if (element.matches("#maxResults")) {
			search.maxResults = Number(element.value);
			form.reloadOptions(search);
		}
	});
});

function $(selector) {
	return document.querySelector(selector);
}

function $$(selector) {
	return Array.from(document.querySelectorAll(selector));
}

/*
 * RowCollection prototype
 */

function RowCollection() {
	this.rows = [];
}

RowCollection.prototype.getRow = function(n=0) {
	return this.rows[n];
};

RowCollection.prototype.addRow = function(n=0) {
	const subject = this.rows.length > 0
	              ? this.rows[n].subject
	              : DEFAULTS.SUBJECT;
	const row = new Row(n, subject);
	this.rows.splice(n + 1, 0, row);
	this.renumberRows();
};

RowCollection.prototype.removeRow = function(n=0) {
	this.rows.splice(n, 1);
	this.renumberRows();
};

RowCollection.prototype.renumberRows = function() {
	for (const [n, row] of this.rows.entries()) {
		row.n = Number(n);
	}
};

/*
 * Row prototype
 */

function Row(n, subject) {
	this.n = n;

	this.condition = 0;
	this.value = 0;
	this.flags = new Map();

	this.setSubject(subject);
}

Row.prototype.setSubject = function(subject) {
	const predicate = subject == SUBJECT.VISIT_COUNT
	                ? PREDICATE.NUMBER
	                : PREDICATE.STRING;

	// resets value to default if type changes
	if (this.predicate != predicate) {
		this.value = 0;
	}

	this.subject = subject;
	this.predicate = predicate;
};

Row.prototype.setFlag = function(key, value) {
	this.flags.set(key, value);
};

/*
 * Form prototype
 */

function Form() {
	this.sortBy = DEFAULTS.SORT_BY;
	this.sortOrder = DEFAULTS.SORT_ORDER;

	this.searching = false;
}

Form.prototype.load = function(options) {
	if (options != undefined) {
		const {sortBy, sortOrder} = options;

		this.sortBy = sortBy;
		this.sortOrder = sortOrder;
	}
};

Form.prototype.save = function() {
	return {
		sortBy:    this.sortBy,
		sortOrder: this.sortOrder
	};
};

Form.prototype.init = function() {
	for (const element of $$(".message")) {
		element.hidden = true;
	}

	this.toggleOptions(false);
};

Form.prototype.createRow = function(row) {
	const rowElement = document.createElement("div");
	rowElement.className = "row";
	rowElement.append($("#subject").content.cloneNode(true));
	rowElement.append($("#predicate").content.cloneNode(true));
	rowElement.append($("#buttons").content.cloneNode(true));
	rowElement.querySelector(".subject").value = row.subject;

	const elements = $("#search").children;

	if (elements.length > 0) { // inserts after previous row
		elements[row.n].after(rowElement);
		elements[elements.length - 1].scrollIntoView();
	} else { // inserts at end if first item
		$("#search").append(rowElement);
	}

	this.createPredicate(rowElement, row);
	this.renumberRows();
};

Form.prototype.deleteRow = function(n) {
	const elements = $$(".row");

	if (elements.length <= 1) { // cannot remove if only row
		return;
	}

	elements[n].remove();
	this.renumberRows();
};

Form.prototype.renumberRows = function() {
	const elements = $$(".row");

	for (const [n, element] of elements.entries()) {
		element.dataset.row = n;
	}

	// disables remove button if only one row
	elements[0].querySelector(".remove").disabled = elements.length == 1;
};

Form.prototype.createPredicate = function(rowElement, row) {
	let element = null;
	let predicate = PREDICATE.STRING;

	if (row.subject == SUBJECT.VISIT_COUNT) {
		element = $("#number").content.cloneNode(true);
		predicate = PREDICATE.NUMBER;
	} else {
		element = $("#string").content.cloneNode(true);
		predicate = PREDICATE.STRING;
	}

	// does not replace if existing node is the same,
	// avoids clearing user input unnecessarily
	if (rowElement.dataset.predicate != predicate) {
		rowElement.dataset.predicate = predicate;
		rowElement.querySelector(".predicate").replaceWith(element);
	}
};

Form.prototype.changePredicate = function(row) {
	const elements = $$(".row");
	this.createPredicate(elements[row.n], row);
};

Form.prototype.findRow = function(n=0) {
	n = Math.max(n, 0);

	const rowElement = $$(".row").find(function(element) {
		return Number(element.dataset.row) == n;
	});

	return rowElement.querySelector(".value");
};

Form.prototype.focusRow = function(n) {
	this.findRow(n).focus();
};

Form.prototype.selectRow = function(n) {
	this.findRow(n).select();
};

Form.prototype.loading = function() {
	this.searching = true;
	$("#submit").disabled = true;
};

Form.prototype.showResults = function(results, search) {
	const resultsContainerElement = document.createElement("div");
	resultsContainerElement.id = "results";

	switch (this.sortBy) { // initially sorted by visit time
		case SORT_BY.TITLE:
			results = results.sort(function(a, b) {
				return sortByString(a.title, b.title);
			});
			break;
		case SORT_BY.URL:
			results = results.sort(function(a, b) {
				return sortByString(a.url, b.url);
			});
			break;
		case SORT_BY.VISIT_COUNT:
			results = results.sort(function(a, b) {
				return sortByNumber(a.visitCount, b.visitCount);
			});
			break;
	}

	if (this.sortOrder == SORT_ORDER.ASCENDING) {
		results = results.reverse();
	}

	for (const result of results) {
		const {title, url, lastVisitTime, visitCount} = result;

		const dateTime = new Date(lastVisitTime);
		const lastVisit = dateTime.toLocaleString([], DATE_FORMAT);

		const resultElement = $("#result").content.cloneNode(true);
		resultElement.querySelector(".title").textContent = title;
		resultElement.querySelector(".link").href = url;
		resultElement.querySelector(".link").textContent = url;
		resultElement.querySelector(".lastVisit").textContent = lastVisit;
		resultElement.querySelector(".visitCount").textContent = visitCount;
		resultElement.querySelector(".setDate").value = lastVisitTime;
		resultElement.querySelector(".showVisits").hidden = visitCount < 2;
		resultElement.querySelector(".showVisits").value = url;
		resultElement.querySelector(".closeVisits").hidden = true;
		resultElement.querySelector(".delete").value = url;
		resultsContainerElement.append(resultElement);
	}

	$("#results").replaceWith(resultsContainerElement);
	$("#submit").disabled = false;

	const resultsFound = results.length > 0;
	const dateRangeUsed = search.startDate != null || search.endDate != null;

	$("#noResults").hidden = resultsFound || dateRangeUsed;
	$("#noResultsWithDate").hidden = resultsFound || !dateRangeUsed;

	function sortByNumber(a, b) {
		return b - a;
	}

	function sortByString(a, b) {
		if (a == null) {
			return 1;
		}

		if (b == null) {
			return -1;
		}

		return b.localeCompare(a);
	}
};

Form.prototype.showVisits = function(resultElement, url) {
	const allVisitsElement = resultElement.querySelector(".allVisits");

	// shows list if already generated
	if (allVisitsElement.children.length > 0) {
		allVisitsElement.hidden = false;
	} else { // generates list for the first time
		chrome.history.getVisits({url}).then(function(visits) {
			const div = $("#allVisits").content.cloneNode(true);
			const ul = document.createElement("ul");

			for (const visit of visits) {
				const {visitTime} = visit;

				const dateTime = new Date(visitTime);
				const lastVisit = dateTime.toLocaleString([], DATE_FORMAT);

				const li = $("#visit").content.cloneNode(true);
				li.querySelector(".dateTime").textContent = lastVisit;
				li.querySelector(".setDate").value = visitTime;
				ul.append(li);
			}

			div.querySelector("ul").replaceWith(ul);
			allVisitsElement.replaceWith(div);
		});
	}

	const closeButton = resultElement.querySelector(".closeVisits");
	closeButton.classList.add("rotating");
	closeButton.addEventListener("animationend", function() {
		this.classList.remove("rotating");
	});
	closeButton.hidden = false;

	resultElement.querySelector(".showVisits").hidden = true;
};

Form.prototype.closeVisits = function(resultElement) {
	const showButton = resultElement.querySelector(".showVisits");
	showButton.classList.add("rotating");
	showButton.addEventListener("animationend", function() {
		this.classList.remove("rotating");
	});
	showButton.hidden = false;

	resultElement.querySelector(".allVisits").hidden = true;
	resultElement.querySelector(".closeVisits").hidden = true;
};

Form.prototype.deleteItem = function(resultElement, url) {
	chrome.history.deleteUrl({url}).then(function(visits) {
		resultElement.classList.add("deleting");
		resultElement.addEventListener("animationend", function() {
			this.remove();
		});
	});
};

Form.prototype.reloadOptions = function(search) {
	$("#sortBy").value = this.sortBy;
	$("#sortOrder").checked = this.sortOrder;

	$("#dateRange").value = search.dateRange;
	$("#startDate").value = search.startDate;
	$("#endDate").value = search.endDate;

	$("#maxResults").value = search.maxResults;
	$("#numResults").value = Math.pow(10, search.maxResults).toLocaleString();

	for (const element of $$(".date, .reset")) {
		element.disabled = search.dateRange != DATE_RANGE.SPECIFIC_RANGE;
	}

	for (const element of $$(".match")) {
		const value = Number(element.value);
		element.classList.toggle("disabled", search.match != value);
	}
};

Form.prototype.toggleOptions = function(state=false) {
	for (const element of $$(".option")) {
		element.disabled = !state;
	}
};

Form.prototype.setDate = function(search, visitTime) {
	const startDate = new Date(visitTime);
	const nextDay = new Date(startDate).setDate(startDate.getDate() + 1);
	const endDate = new Date(nextDay);

	search.dateRange = DATE_RANGE.SPECIFIC_RANGE;
	search.startDate = formatDate(convertFromUTC(startDate));
	search.endDate = formatDate(convertFromUTC(endDate));

	this.reloadOptions(search);

	restartAnimation($("#startDate"));
	restartAnimation($("#endDate"));

	function formatDate(dateTime) {
		return dateTime.toISOString().slice(0, 10);
	}

	function convertFromUTC(dateTime) {
		return new Date(dateTime.setHours(dateTime.getHours() - TZ_OFFSET));
	}

	function restartAnimation(element) {
		element.classList.add("flashing");
		element.addEventListener("animationend", function() {
			this.classList.remove("flashing");
		});
	}
};

/*
 * Search prototype
 */

function Search(rowCollection) {
	this.dateRange = DEFAULTS.DATE_RANGE;
	this.startDate = null;
	this.endDate = null;
	this.match = DEFAULTS.MATCH;
	this.maxResults = DEFAULTS.MAX_RESULTS;

	this.rowCollection = rowCollection;
}

Search.prototype.load = function(options) {
	if (options != undefined) {
		const {dateRange, startDate, endDate, match, maxResults} = options;

		this.dateRange = dateRange;
		this.startDate = startDate;
		this.endDate = endDate;
		this.match = match;
		this.maxResults = maxResults;
	}
};

Search.prototype.save = function() {
	return {
		dateRange:  this.dateRange,
		startDate:  this.startDate,
		endDate:    this.endDate,
		match:      this.match,
		maxResults: this.maxResults
	};
};

Search.prototype.search = function() {
	const {startTime, endTime} = this.getDateRange();

	return chrome.history.search({
		text:       this.getText(),
		startTime:  startTime,
		endTime:    endTime,
		maxResults: Math.pow(10, this.maxResults || DEFAULTS.MIN_RESULTS)
	}).then(function(historyItems) {
		return this.filter(historyItems);
	}.bind(this));
};

Search.prototype.filter = function(results) {
	if (this.match == MATCH.ALL) {
		return results.filter(function(result) { // match all
			return this.rowCollection.rows.every(function(row) {
				return checkRow.call(this, row, result);
			}, this);
		}, this);
	}

	return results.filter(function(result) { // match any
		return this.rowCollection.rows.some(function(row) {
			return checkRow.call(this, row, result);
		}, this);
	}, this);

	function checkRow(row, result) {
		switch (row.subject) {
			case SUBJECT.TITLE:
				return this.checkString(
					row.condition,
					result.title,
					row.value,
					row.flags
				);
			case SUBJECT.URL:
				return this.checkString(
					row.condition,
					result.url,
					row.value,
					row.flags
				);
			case SUBJECT.TITLE_OR_URL:
				return this.checkString(
					row.condition,
					result.title,
					row.value,
					row.flags
				) || this.checkString(
					row.condition,
					result.url,
					row.value,
					row.flags
				);
			case SUBJECT.HOST:
				return this.checkString(
					row.condition,
					new URL(result.url).hostname,
					row.value,
					row.flags
				);
			case SUBJECT.PATH:
				return this.checkString(
					row.condition,
					new URL(result.url).pathname,
					row.value,
					row.flags
				);
			case SUBJECT.VISIT_COUNT:
				return this.checkNumber(
					row.condition,
					result.visitCount,
					row.value
				);
		}
	}
};

Search.prototype.checkString = function(condition, compare, value, flags) {
	const matchCase = flags.get("matchCase");
	const matchWholeWord = flags.get("matchWholeWord");

	compare ||= ""; // converts to empty string if null or undefined

	if (!matchCase) {
		compare = compare.toString().toLowerCase();
		value = value.toString().toLowerCase();
	}

	if (!matchWholeWord) {
		switch (condition) {
			case STRING.CONTAINS:
				return compare.includes(value);
			case STRING.DOES_NOT_CONTAIN:
				return !compare.includes(value);
			case STRING.STARTS_WITH:
				return compare.startsWith(value);
			case STRING.DOES_NOT_START_WITH:
				return !compare.startsWith(value);
			case STRING.ENDS_WITH:
				return compare.endsWith(value);
			case STRING.DOES_NOT_END_WITH:
				return !compare.endsWith(value);
		}
	} else {
		switch (condition) {
			case STRING.CONTAINS:
				return new RegExp(`\\b${value}\\b`).test(compare);
			case STRING.DOES_NOT_CONTAIN:
				return !new RegExp(`\\b${value}\\b`).test(compare);
			case STRING.STARTS_WITH:
				return new RegExp(`^${value}\\b`).test(compare);
			case STRING.DOES_NOT_START_WITH:
				return !new RegExp(`^${value}\\b`).test(compare);
			case STRING.ENDS_WITH:
				return new RegExp(`\\b${value}$`).test(compare);
			case STRING.DOES_NOT_END_WITH:
				return !new RegExp(`\\b${value}$`).test(compare);
		}
	}
};

Search.prototype.checkNumber = function(condition, compare, value) {
	switch (condition) {
		case NUMBER.EQUAL_TO:
			return compare == value;
		case NUMBER.NOT_EQUAL_TO:
			return compare != value;
		case NUMBER.LESS_THAN_OR_EQUAL_TO:
			return compare <= value;
		case NUMBER.LESS_THAN:
			return compare < value;
		case NUMBER.GREATER_THAN_OR_EQUAL_TO:
			return compare >= value;
		case NUMBER.GREATER_THAN:
			return compare > value;
	}
};

Search.prototype.getText = function() {
	// joins all search strings together
	return this.rowCollection.rows.filter(function(row) {
		return row.predicate == PREDICATE.STRING
		    && (row.condition == STRING.CONTAINS
		     || row.condition == STRING.STARTS_WITH
		     || row.condition == STRING.ENDS_WITH);
	}).map(function(row) {
		return row.value == 0 ? "" : row.value;
	}).join(" ");
};

Search.prototype.getDateRange = function() {
	switch (this.dateRange) {
		case DATE_RANGE.LAST_HOUR:
			return {
				startTime: new Date().setHours(new Date().getHours() - 1),
				endTime:   Date.now()
			};
		case DATE_RANGE.LAST_DAY:
			return {
				startTime: new Date().setDate(new Date().getDate() - 1),
				endTime:   Date.now()
			};
		case DATE_RANGE.LAST_WEEK:
			return {
				startTime: new Date().setDate(new Date().getDate() - 7),
				endTime:   Date.now()
			};
		case DATE_RANGE.LAST_MONTH:
			return {
				startTime: new Date().setMonth(new Date().getMonth() - 1),
				endTime:   Date.now()
			};
		case DATE_RANGE.LAST_YEAR:
			return {
				startTime: new Date().setFullYear(new Date().getFullYear() - 1),
				endTime:   Date.now()
			};
		case DATE_RANGE.ALL_TIME:
			return {
				startTime: 0,
				endTime:   Date.now()
			};
	}

	const startTime = this.startDate == null
	                ? 0
	                : convertToUTC(this.startDate);
	const endTime = this.endDate == null
	              ? Date.now()
	              : convertToUTC(this.endDate);

	// swaps times if start time comes after end time
	if (startTime > endTime) {
		return {startTime: endTime, endTime: startTime};
	}

	return {startTime, endTime};

	function convertToUTC(date) {
		return new Date(date).setHours(new Date(date).getHours() + TZ_OFFSET);
	}
};