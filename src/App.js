import React from 'react';
import { BrowserRouter as Router, Routes, Route, Switch } from 'react-router-dom';
import PostList from './page/PostList';
import Post from './page/Post';
import Empty from './page/404';
import About from './page/About';
import Activity from './page/Activity';

import CONFIG from "./config";

// import generateSitemap from './sitemap';



// 设置路由
function App() {
    return (
        // <ScrollToTop>
        <Router >
            <Routes >
                <Route exact path="/" element={<Post title={CONFIG.title} />} />
                <Route path="/post/*" element={<Post title={CONFIG.title} />} />
                <Route path="/notes/" element={<PostList title={CONFIG.title} />} />
                <Route path="/activity" element={<Activity />} />

                <Route path="/404/" element={<Empty title={CONFIG.title} />} />
                <Route element={<Empty title={CONFIG.title} />} />

                {/* <Route path="/sitemap.xml" render={generateSitemap} /> */}

            </Routes>
        </Router>
        // </ScrollToTop>
    )
}
export default App;