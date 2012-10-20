var message = {
    create : function (payload) {
        return {
            url: payload['mi-visit-url'],
            ipaddress: payload.IPAddress,
            useragent: payload.UserAgent,
            site: payload.mi_urlinfo_site,
            product: payload.mi_urlinfo_product,
            pagetype: payload.mi_urlinfo_type,
            mediasource: payload.m,
            campaign: payload.cam,
            adgroup: payload.adg,
            referrer: payload.r,
            userid: payload['MI-LifeTimeCookie'],
            createtime: payload.CreateTime,
            latitude: payload.latitude,
            longitude: payload.longitude
        };
    }
};

module.exports = message;