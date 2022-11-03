var matchAPIAddr = 'https://alg.gpms365.net/'
var eListAPI = matchAPIAddr + 'parse/el/'
var pagePathAPI = matchAPIAddr + 'parse/pp/'
var depositAPI = matchAPIAddr + 'depositDetect/'

function encodeObj(element_url, elementClasses, elementId, elementText, dataanalyticsID) {
    return JSON.stringify({
        'element_url': element_url,
        'elementClasses': elementClasses,
        'elementId': elementId,
        'elementText': elementText,
        'dataanalyticsID': dataanalyticsID
    })
}

function msgHub(page, msg) {
    var hubId = page.replace(".", "")
    var hub = document.getElementById(hubId);
    if (hub == null) {
        var ifrm_msgHub = document.createElement('iframe');
        ifrm_msgHub.setAttribute('id', hubId);
        ifrm_msgHub.setAttribute('class', 'g_conv');
        ifrm_msgHub.setAttribute('src', 'https://' + page)
        ifrm_msgHub.setAttribute('domain', 'https://' + page);
        ifrm_msgHub.style.display = "none";
        ifrm_msgHub.addEventListener("DOMContentLoaded", function () {
            hub = document.getElementById(hubId);
            hub.contentWindow.postMessage(msg, 'https://' + page);
        });
        document.body.appendChild(ifrm_msgHub);

    } else {
        hub.contentWindow.postMessage(msg, 'https://' + page);
    }
}

function matchBasic(sPageURL) {
    return new Promise((resolve, reject) => {
        let result = new Array();
        sPageURL = decodeURIComponent(sPageURL);
        RuleURLidx = sPageURL.indexOf("dataanalyticsID");
        let ga_c_id = 'null';
        if (RuleURLidx == -1) {
            reject(result);
        } else {
            ga_c_id = sPageURL.split('ga_c_id=').pop().split('&registerVar')[0];
            registerVar = sPageURL.split('registerVar=').pop().split('&depositVar')[0];
            depositVar = sPageURL.split('depositVar=').pop().split('&dataanalyticsID')[0];

            if (sPageURL.indexOf("register=true") != -1) {
                result.push("register");
            }
            if (sPageURL.indexOf("member/deposit") != -1) {
                result.push("deposit");
            }
            if ((sPageURL.indexOf("ga_c_id") != -1) && (ga_c_id != 'null')) {
                result.push("logged_in");
            }
            if (registerVar == 1) {
                // console.log('mapping registerVar');
                result.push("register_event");
            }
            if (depositVar == 1) {
                result.push("deposit_event");
            }
        }
        resolve(result);
    });
}

function matchPP(sPageURL, sitename) {
    return new Promise((resolve, reject) => {
        let result = new Array();
        sPageURL = decodeURIComponent(sPageURL);
        RuleURLidx = sPageURL.indexOf("dataanalyticsID");
        RuleEndIdx = sPageURL.indexOf("&rnd");
        RuleURL = sPageURL.substring(RuleURLidx, RuleEndIdx);
        if (RuleURLidx == -1) {
            reject(result);
        } else {
            let formData = new FormData();
            formData.append('sitename', sitename);
            formData.append('pagePath', RuleURL);
            fetch(pagePathAPI, {
                body: formData,
                method: "post"
            }).then(
                response => response.json()
            ).then(
                json => {
                    if (json["status"] != "ok") {
                        //console.error("pagepath match err: " + json["message"])
                    } else {
                        // console.log(json);
                        if (json["data"]["PCAGradient"] == 1) {
                            result.push("PCAGradient");
                        }
                        if (json["data"]["skipconnection"] == 1) {
                            result.push("skipconnection");
                        }
                        if (json["data"]["backRNN"] == 1) {
                            result.push("backRNN");
                        }
                        if (json["data"]["forcingLSTM"] == 1) {
                            result.push("forcingLSTM");
                        }
                        if (json["data"]["Lifetree"] == 1) {
                            result.push("Lifetree");
                        }
                        if (json["data"]["RandomTokenPreOne"] == 1) {
                            result.push("RandomTokenPreOne");
                        }
                        if (json["data"]["MuZero"] == 1) {
                            result.push("MuZero");
                        }
                        if (json["data"]["walkPool"] == 1) {
                            result.push("walkPool");
                        }
                    }
                }
            ).then(() => { resolve(result); });
        }
    });
}

function matchEL(sPageURL, sitename) {
    return new Promise((resolve, reject) => {
        let result = new Array();
        sPageURL = decodeURIComponent(sPageURL);
        RuleURLidx = sPageURL.indexOf("dataanalyticsID");
        if (RuleURLidx != -1) {
            reject(result);
        } else {
            elistURLidx = sPageURL.indexOf("eList") + ("eList=").length;
            elistendIdx = sPageURL.indexOf("&rnd");
            eList = sPageURL.substring(elistURLidx, elistendIdx);

            let formData = new FormData();
            formData.append('sitename', sitename);
            formData.append('eList', eList);

            fetch(eListAPI, {
                body: formData,
                method: "post"
            }).then(
                response => response.json()
            ).then(
                json => {
                    if (json["status"] != "ok") {
                        //console.error("elist match err: " + json["message"])
                    } else {
                        if (json["data"]["2gram_mainTFIDF_ALL"] == 1) {
                            result.push("2gram_mainTFIDF_ALL");
                        }
                        if (json["data"]["2gram_mainTFIDF_Discriminator"] == 1) {
                            result.push("2gram_mainTFIDF_Discriminator");
                        }

                    }
                }
            ).then(() => { resolve(result); });
        }
    });
}



function doTempCentralize() {

    let site_domain = window.location.hostname
    let ga_c_id = "null"
    let registerVar = 0
    let depositVar = 0

    for (i = 0; i < dataLayer.length; i++) {
        if ('ga_c_id' in dataLayer[i]) {
            ga_c_id = dataLayer[i]['ga_c_id'];
            continue;
        }
        if (dataLayer[i]['event'] == 'ocms-event/signup-success') {
            registerVar = 1;
            continue;
        }
        if (dataLayer[i]['event'] == 'ocms-event/deposit-success') {
            depositVar = 1;
            continue;
        }
    }

    var seqLen = 10;
    var ListForClick = [];
    for (i = 0; i < dataLayer.length; i++) {
        var event = dataLayer[i]['event'];
        if (event == "gtm.click" || event == "gtm.linkClick") {
            ListForClick.push(i);
        }

    }


    let findurl = window.location.href;
    let idx = findurl.indexOf('.com/');
    findurl = findurlPrefix + findurl.slice(idx + 5);

    eList = [];
    let ppSPageUrl = "";
    let elSPageUrl = "";

    for (i = ListForClick.length - 1; i >= 0; i--) {
        var currentDataLayer = dataLayer[ListForClick[i]];
        var elementUrl = ""
        var elementClasses = ""
        var elementId = ""
        var elementText = ""
        var tmp_text = ""
        var dataanalyticsID = "null"
        if ((currentDataLayer['event'] == "gtm.click") || (currentDataLayer['event'] == "gtm.linkClick")) {
            //handling eURL
            try {
                if ('gtm.elementUrl' in currentDataLayer) {
                    elementUrl = currentDataLayer['gtm.elementUrl'];
                    if (elementUrl == "") {
                        elementUrl = "/";
                    }
                    else {
                        fullsite_domain = 'https://' + site_domain
                        var re = RegExp(fullsite_domain, 'g');
                        elementUrl = elementUrl.replace(re, "");
                        var re = RegExp('https://download.ocms365.com', 'g');
                        elementUrl = elementUrl.replace(re, "");
                        var re = RegExp('\\?pid.*', 'g');
                        elementUrl = elementUrl.replace(re, "");
                        var re = RegExp('\\?_ga.*', 'g');
                        elementUrl = elementUrl.replace(re, "");
                        var re = RegExp('\\?version.*', 'g');
                        elementUrl = elementUrl.replace(re, "");
                        var re = RegExp('javascript\\:', 'g');
                        elementUrl = elementUrl.replace(re, "/");
                    }
                }
            } catch (e) {
                elementUrl = "/";
                console.log(e);
            }

            //handling eClass
            try {
                if ('gtm.elementClasses' in currentDataLayer) {
                    elementClasses = currentDataLayer['gtm.elementClasses'];
                }
            } catch (e) {
                elementClasses = "";
                console.log(e);
            }

            //handling eID
            try {
                if ('gtm.elementId' in currentDataLayer) {
                    elementId = currentDataLayer['gtm.elementId'];
                }
            } catch (e) {
                elementId = "";
                console.log(e);
            }

            //handling of eTxt
            try {
                if ('gtm.element' in currentDataLayer) {
                    if ('innerText' in currentDataLayer['gtm.element']) {
                        tmp_text = currentDataLayer['gtm.element']["innerText"].replaceAll('\n', ' ');
                        var re = RegExp('\\d\\d\\d\\d/\\d\\d\\/\\d\\d', 'g');
                        tmp_text = tmp_text.replace(re, "-DATE-");
                        var re = RegExp('\\d\\d:\\d\\d:\\d\\d', 'g');
                        tmp_text = tmp_text.replace(re, "-TIME-");
                        var re = RegExp('\\w+\\*\\*\\*', 'g');
                        tmp_text = tmp_text.replace(re, "-ACCOUNT-");
                        var re = RegExp('ได้รับ\\dแชมป์ต่อไป', 'g');
                        tmp_text = tmp_text.replace(re, "ได้รับ-RAND-แชมป์ต่อไป");
                        var re = RegExp('\\d+สัปดาห์', 'g');
                        tmp_text = tmp_text.replace(re, "-RAND-สัปดาห์");
                        var re = RegExp('(฿|฿ )\\d+\\.\\d+', 'g');
                        tmp_text = tmp_text.replace(re, "฿-RAND-");
                        var re = RegExp('กระเป๋าสตางค์ \\d+\\.\\d+', 'g');
                        tmp_text = tmp_text.replace(re, "กระเป๋าสตางค์-RAND-");
                        //replace %
                        tmp_text = tmp_text.replace(/%/g, '%25');

                        if (elementClasses.includes("winner") || elementClasses.includes("rank")) {
                            var re = RegExp('\\d+\\.\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                        if (elementClasses == "price") {
                            var re = RegExp('\\d+\\.\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                        if (elementClasses == "game-info" || elementClasses == "tabstab") {
                            var re = RegExp('\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                    } else if ('textContent' in dataLayer[i]['gtm.element']) {
                        tmp_text = dataLayer[i]['gtm.element']["textContent"].replaceAll('\n', ' ');
                        var re = RegExp('\\d\\d\\d\\d/\\d\\d\\/\\d\\d', 'g');
                        tmp_text = tmp_text.replace(re, "-DATE-");
                        var re = RegExp('\\d\\d:\\d\\d:\\d\\d', 'g');
                        tmp_text = tmp_text.replace(re, "-TIME-");
                        var re = RegExp('\\w+\\*\\*\\*', 'g');
                        tmp_text = tmp_text.replace(re, "-ACCOUNT-");
                        var re = RegExp('ได้รับ\\dแชมป์ต่อไป', 'g');
                        tmp_text = tmp_text.replace(re, "ได้รับ-RAND-แชมป์ต่อไป");
                        var re = RegExp('\\d+สัปดาห์', 'g');
                        tmp_text = tmp_text.replace(re, "-RAND-สัปดาห์");
                        var re = RegExp('(฿|฿ )\\d+\\.\\d+', 'g');
                        tmp_text = tmp_text.replace(re, "฿-RAND-");
                        var re = RegExp('กระเป๋าสตางค์ \\d+\\.\\d+', 'g');
                        tmp_text = tmp_text.replace(re, "กระเป๋าสตางค์-RAND-");
                        //replace %
                        tmp_text = tmp_text.replace(/%/g, '%25');

                        if (elementClasses.includes("winner") || elementClasses.includes("rank")) {
                            var re = RegExp('\\d+\\.\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                        if (elementClasses == "price") {
                            var re = RegExp('\\d+\\.\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                        if (elementClasses == "game-info" || elementClasses == "tabstab") {
                            var re = RegExp('\\d+', 'g');
                            tmp_text = tmp_text.replace(re, "-RAND-");
                        }
                    }
                }
            } catch (e) {
                tmp_text = "";
                console.log(e);
            }
            elementText = tmp_text;

            //handling dID
            try {
                if ('gtm.element' in currentDataLayer) {
                    if ('dataset' in currentDataLayer['gtm.element']) {
                        if ('analytics' in currentDataLayer['gtm.element'].dataset) {
                            dataanalyticsID = currentDataLayer['gtm.element'].dataset["analytics"];
                        }
                    }
                }
            } catch (e) {
                dataanalyticsID = "null";
                console.log(e);
            }

            if (elementUrl == "/" && elementClasses == "" && elementId == "" && dataanalyticsID == "null") {
                if (elementText != "" && !isNaN(Number(elementText))) {
                    var re = RegExp('\\d+\\.\\d+', 'g');
                    elementText = elementText.replace(re, "-RAND-");
                }
            }
            if (elementClasses.includes("vdatetime")) {
                elementText = "";
            }
            if (elementClasses.includes("phoneNumber")) {
                elementText = "";
            }

            elementUrl = elementUrl.replace(/'/g, "-singleQuotePLH-").replace(/ /g, "%20").replace(/#/g, "-hashMarkPLH-").replace(/\t/g, "-TAB-");
            elementClasses = elementClasses.replace(/'/g, "-singleQuotePLH-").replace(/ /g, "%20").replace(/#/g, "-hashMarkPLH-").replace(/\t/g, "-TAB-");
            elementId = elementId.replace(/'/g, "-singleQuotePLH-").replace(/ /g, "%20").replace(/#/g, "-hashMarkPLH-").replace(/\t/g, "-TAB-");

            var encoded = encodeObj(elementUrl, elementClasses, elementId, tmp_text, dataanalyticsID);
            var code = ssjson[encoded];
            if (code != undefined) {
                if (eList.length == 0) {
                    eList.push(code);
                } else {
                    if (eList[eList.length - 1] != code) {
                        eList.push(code);
                    }
                }
            }

            if (eList.length >= seqLen) {
                break;
            }

        }
        else if (currentDataLayer['event'] == "gtm.historyChange") {
            if (currentDataLayer['gtm.newUrl'].indexOf("?register=true") !== -1 || currentDataLayer['gtm.newUrl'].indexOf("user=new") !== -1) {
                if (eList.length == 0) {
                    eList.push(-1);
                } else {
                    if (eList[eList.length - 1] != -1) {
                        eList.push(-1);
                    }
                }
                if (eList.length >= seqLen) {
                    break;
                }
            }
        }

        if (i == ListForClick.length - 1) {
            ppSPageUrl = `https://fake?url=${findurl}&ga_c_id=${ga_c_id}&registerVar=${registerVar}&depositVar=${depositVar}&dataanalyticsID=${dataanalyticsID}&element_url==${elementUrl}&elementClasses=${elementClasses}&elementId=${elementId}&elementText=${elementText}&rnd=`;
        }

    }
    eList = eList.reverse();

    if (eList.length == 0) {
        eList.push("empty");
    } else {
        eList.push("");
    }
    eList = eList.toString();
    eList = eList.replace(/,,+/g, ",");
    if (eList != 'empty') {
        elSPageUrl = `https://fake?url=${findurl}&eList=${eList}&rnd=`;
    }

    Promise.allSettled([
        matchBasic(ppSPageUrl),
        matchPP(ppSPageUrl, sitename),
        matchEL(elSPageUrl, sitename),
    ])
        .then(values => {
            var limitOfEach = 10;
            rndTime = new Date().getTime();
            console.log(rndTime);
            let evts = new Array();
            values.forEach(element => {
                if (element.status == "fulfilled") {
                    var probThrd = limitOfEach / element.value.length;
                    if (Math.random() <= probThrd) {
                        element.value.forEach(kw => {
                            if (typeof (kw) == 'string') {
                                evts.push(kw);
                            }
                        });
                    }
                }
            });

            let evtUrlForSPageParam = `url=${findurl}&rnd=${rndTime}`;
            if (evts.length) {
                evtUrlForSPageParam = evtUrlForSPageParam + "&evts=";
                for (i = 0; i < evts.length; i++) {
                    evtUrlForSPageParam = evtUrlForSPageParam + evts[i];
                    if (i != evts.length - 1) {
                        evtUrlForSPageParam = evtUrlForSPageParam + ",";
                    }
                }
            }
            spageDomainNames.forEach(domain_name => {
                var evtUrlForSPage = `https://${domain_name}?${evtUrlForSPageParam}`
                console.log(evtUrlForSPage);
                msgHub(domain_name, evtUrlForSPage);
            });

        })
        .catch(err => console.log(err));


    window.onerror = function (e) {
        if (e.toString().indexOf("Blocked a frame with origin") != -1) {
            console.clear();
        }
    }
}

doTempCentralize();

