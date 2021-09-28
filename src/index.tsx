import ReactDOM from 'react-dom';
import './index.less';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Switch, Router, Route} from 'react-router-dom';
import { createBrowserHistory } from 'history';

export const history = createBrowserHistory();

ReactDOM.render(
  <Router history={history}>
    <Switch>
      <Route path='/'>
        <App />
      </Route>
    </Switch>
  </Router>,
  document.getElementById('root')
);

/* 取消应用加载动画 */
function preloaderFinished() {
  const body: any = document.querySelector('body');
  const preloader = document.querySelector('.preloader');

  body.style.overflow = 'hidden';
  function remove() {
    if (!preloader) { return; }
    preloader.className += ' preloader-hidden-add preloader-hidden-add-active';
    const t$ = setTimeout(() => {
      preloader.className = 'preloader-hidden';
      clearTimeout(t$);
    }, 100);
  }
  const t$ = setTimeout(() => {
    remove();
    body.style.overflow = '';
    clearTimeout(t$);
  }, 100);
}

preloaderFinished();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
