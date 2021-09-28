import { message } from 'antd';
import axios from 'axios';
import {history} from '../index';

axios.defaults.timeout = 60000;

/* 请求前置处理器 */
axios.interceptors.request.use(function(config) {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = token;
    }
    return config;
}, function(error) {
    return Promise.reject(error);
});

/* 请求后置处理器 */
axios.interceptors.response.use(function(response) {
    const url = response.config.url;
    const whiteList = ['/shipin', '/shipinliu', '/prod-api/login', '/prod-api/getInfo', '/prod-api/getRouters']; /* 接口url白名单---用来处理返回体不统一的情况 */
    const urlInWhiteList = whiteList.findIndex(item => {
        return url?.startsWith(item);
    });
    if (urlInWhiteList > -1) {
        if (response.data.code + '' === '401') {
            history.push('/login');
            message.error(response.data.msg);
            return Promise.reject(response.data.msg);
        }
        return response.data;
    }
    if (response.data.code) {
        if (response.data.code + '' === '200') {
            return response.data.data;
        } else {
            message.error(response.data.msg);
            return Promise.reject(response.data.msg);
        }
    }
    if (url?.endsWith('.json')) { /* 请求本地静态json文件 */
        return response.data;
    }
    if (response.config.responseType === 'blob') {
        return response;
    }
    message.warning(`接口${url},返回体不标准!`);
    return Promise.reject(`接口${url},返回体不标准!`);
}, function(error) {
    const url = error.response?.config?.url;
    const status = error.response?.status; /* 状态码 */
    switch (status) {
        case 400:
            message.error('错误的请求。由于语法错误，该请求无法完成！');
            return Promise.reject(error);
        case 401: /* token失效 */
            message.error('用户登录失效，请重新登录！');
            localStorage.setItem('preUrl', window.location.pathname + window.location.search);
            history.push('/login');
            return Promise.reject(error);
        case 404:
            message.error(`接口${url}不存在！`);
            return Promise.reject(error);
        case 500:
            message.error(`服务端500异常！`);
            return Promise.reject(error);
        case 504:
            message.error(`网关超时！`);
            return Promise.reject(error);
        default:
            if ((error.message || '').startsWith('timeout of')) {
                return Promise.reject('请求超时!!!')
            }
            return Promise.reject(error);
    }
});

export default axios;