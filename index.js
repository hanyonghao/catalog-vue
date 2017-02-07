/**
 * Created by hanyonghao on 2016/11/26.
 */
;
/**
 * options : {
 *    activeNode : function(node),
 *    swapNode : function(origin,target),
 *    addNode : function(node),
 *    updateNode : function(node),
 *    deleteNode : function(node),
 *    setTreeDate : function(tree)
 * }
 */
var catalog = (function(options){

    Vue.component('catalog', {
        props : ['tree'],
        template : '<div class="catalog">' +
                        '<tree :tree="tree"></tree>' +
                        '<node-mirror v-if="$root.currNodeMirror" :mirror="$root.currNodeMirror"></node-mirror>' +
                   '</div>',
        methods : {
            /*** 以下是公共方法 ***/
            isArray : function(obj){
                return Array.isArray(obj);
            },

            /**
             * 初始化树数据
             * @param tree
             * @param parents
             */
            treeInit : function(tree, parents){
                var self = this;
                var hash = window.location.hash && window.location.hash.substring(1,window.location.hash.length) || "1"; //获取浏览器hash，默认节点 1
                if(self.isArray(tree) && tree.length > 0){
                    for(var i = 0 ; i < tree.length ; i++){
                        var array = self.isArray(parents) ? parents.concat() : []; //克隆父节点数组
                        if(self.isArray(tree[i].articles) && tree[i].articles.length > 0){ //如果有子节点
                            Vue.set(tree[i],"open",false); //设置默认收起
                        }
                        if(tree[i].level == hash){ //如果hash为当前节点
                            self.$root.currActiveNode = tree[i]; //设置当前浏览节点
                            for(var j = 0 ; j < array.length ; j++){ //展开所有父节点
                                array[j].open = true;
                            }
                        }
                        Vue.set(tree[i],"preview","default"); //设置默认显示方式
                        array.push(tree[i]); //添加父节点
                        self.treeInit(tree[i].articles, array);
                    }
                    self.$root.currActiveNode = self.$root.currActiveNode || self.$root.treeData[0]; //如果hash没有对应的节点，则默认第一个节点
                }
            }
        },
        created : function(){
            var self = this;
            self.treeInit(self.tree);
        }
    });

    /*** 目录树 ***/
    Vue.component('tree', {
        props : ['tree','parentNode'],
        data : function(){
            return { flag : false };
        },
        template : //transition-group列表过渡动画
                   '<transition-group name="flip-list" tag="ul" v-if="isArray(tree) && tree.length > 0" :catalog-depth="getDepth(parentNode)" :catalog-size="tree.length" :class="getTreeClass(parentNode)">' +
                        '<li :class="getNodeClass(node)" v-for="node in tree" :key="node">' +

                            //展开的图标按钮
                            '<i :class="getIconClass(node)" :style="getIndentStyle(parentNode)" @click.stop.prevent="toggleStatus(node)" aria-hidden="true"></i>' +

                            //节点内容
                            '<span class="node-content" @click.stop.prevent="activateNode(node)" @dblclick="toggleStatus(node)" @mousedown="mousedown($event, node, tree)" @mouseup="mouseup" @mouseout="mouseout($event, node, parentNode)">' +
                                '<span class="level">{{node.level}}</span>' +
                                '<span class="title">{{node.title}}</span>' +
                            '</span>' +

                            //子节点树
                            '<tree :tree="node.articles" :parent-node="node"></tree>' +
                        '</li>' +
                   '</transition-group>',
        methods : {
            /*** 以下是公共方法 ***/
            isArray : function(obj){
                return Array.isArray(obj);
            },
            isEmpty : function(obj){
                return typeof obj == 'undefined';
            },
            isBoolean : function(obj){
                return typeof obj == 'boolean';
            },
            getDepth : function(node){ //获取树节点深度
                return ((node && node.level) || "").indexOf(".") > -1 ? node.level.split(".").length : node ? 1 : 0 ;
            },

            /**
             * 获取树的class
             * @param node
             */
            getTreeClass : function(node){
                return {
                    tree : true,
                    open : node ? node.open : true
                }
            },

            /**
             * 获取节点class
             * @param node
             */
            getNodeClass : function(node){
                var self = this;
                var clazz = {
                    node : true,
                    active : node == self.$root.currActiveNode
                };
                clazz[node.preview] = true;
                return clazz;
            },

            /**
             * 获取左图标class
             * @param node
             */
            getIconClass : function(node){
                var self = this;
                return {
                    "fa": true,
                    "fa-caret-right" : self.isEmpty(node.open) ? false : !node.open,
                    "fa-caret-down" : self.isEmpty(node.open) ? false : !!node.open
                }
            },

            /**
             * 获取缩进长度样式
             * @param node
             */
            getIndentStyle : function(node){
                var self = this;
                var depth = self.getDepth(node);
                return { "margin-left" : 2 + depth * 14 + "px" }
            },

            /**
             * 切换收起/展开
             * @param node
             */
            toggleStatus : function(node){
                var self = this;
                if(self.isBoolean(node.open)){
                    node.open = !node.open;
                }
            },

            /**
             * 激活当选中节点
             * @param node
             */
            activateNode : function(node){
                var self = this;
                self.$root.currActiveNode = node;
                window.location.hash = node.level;
                typeof options.activeNode == 'function' ? options.activeNode(node) : undefined;
            },

            /*** 以下是节点事件handle ***/
            mousedown : function(e, node, tree){ //鼠标按下
                var self = this;
                if(e.button == 0){ //鼠标左键
                    self.flag = true;
                }else if(e.button == 2){ //鼠标右键
                    document.querySelector(".catalog").oncontextmenu = function () {return false;}; //禁用右键菜单
                    console.log("menu", node, tree);
                }
            },
            mouseup : function(){ //鼠标抬起
                var self = this;
                self.flag = false;
            },
            mouseout : function(e, node, parentNode){ //鼠标移出
                var self = this;
                if(self.flag){

                    self.$root.currNodeMirror = { //设置当前拖拽节点
                        node : node,
                        parentNode : parentNode
                    };

                    document.onselectstart = function(){ //禁止拖拽时选中
                        if(self.$root.currNodeMirror){
                            return false;
                        }
                    };
                    self.flag = false;
                }
            }
        }
    });

    Vue.component('nodeMirror', {
        props : ['mirror'],
        data : function(){
            return {
                catalog : { //目录相对位置
                    width : document.querySelector(".catalog").clientWidth,
                    offsetTop : 15,
                    offsetLeft : 15
                },
                mousePosition : { //鼠标位置
                    top : 0,
                    left : 0
                },
                nodeArray : [], //当前节点位置排序
                isAllow : true, //是否允许交换
                isOverflow : false, //是否超出目录范围
                swapNode : null, //被交换节点
                swapOffset : 5, //节点偏移
                nodeHeight : document.querySelector(".node").clientHeight //节点高度
            }
        },
        template : '<div :style="getMirrorStyle()" :class="getMirrorClass()">' +
                        '<span class="level">{{mirror.node.level}}</span>' +
                        '<span class="title">{{mirror.node.title}}</span>' +
                   '</div>',
        methods : {
            /*** 以下是公共方法 ***/
            isArray : function(obj){
                return Array.isArray(obj);
            },
            isBoolean : function(obj){
                return typeof obj == 'boolean';
            },

            /**
             * 设置
             * @param array
             */
            setNodeArray : function(array){
                var self = this;
                if(self.isArray(array) && array.length > 0){
                    for(var i = 0 ; i < array.length ; i++){
                        self.nodeArray.push({
                            node : array[i],
                            array : array
                        });
                        if(self.isBoolean(array[i].open) && array[i].open){ //如果节点处于展开状态则遍历它的子节点
                            self.setNodeArray(array[i].articles);
                        }
                    }
                }
            },

            /**
             * 拖拽镜像节点时
             * @param e
             */
            moveMirror : function(e){
                var self = this;
                e = e || window.event;
                self.mousePosition.top = e.clientY;
                self.mousePosition.left = e.clientX;
            },

            /**
             * 取消镜像节点时
             * @param e
             */
            cancelMirror : function(e){
                var self = this;

                var origin = self.mirror.node.level; //节点原位置

                if(self.isAllow && !self.isOverflow && self.swapNode){ //如果合法，则交换

                    if(self.mirror.parentNode && self.isArray(self.mirror.parentNode.articles)){ //如果有父节点
                        self.mirror.parentNode.articles.splice(self.mirror.parentNode.articles.indexOf(self.mirror.node),1); //移除原节点
                        if(self.mirror.parentNode.articles.length == 0){ //如果子节点已经全部移除，则清除展开状态
                            Vue.delete(self.mirror.parentNode, "open")
                        }
                    }else{ //如果没有父节点则从树根节点删除
                        self.$root.treeData.splice(self.$root.treeData.indexOf(self.mirror.node),1); //移除原节点
                    }

                    if(self.swapNode){ //如果有交换的节点

                        var node = self.swapNode.content.node; //交换的节点
                        var array = self.swapNode.content.array; //所在数组
                        var type = self.swapNode.swapType; //交换类型

                        if(self.isArray(array) && type == "before"){
                            array.splice(array.indexOf(node), 0, self.mirror.node);
                        }else if(self.isArray(node.articles) && type == "inner"){
                            if(node.articles.length == 0){ //如果被放置节点的子节点数为 0
                                Vue.set(node,"open",false);
                            }
                            node.articles.push(self.mirror.node);
                        }else if(type == "after"){
                            self.$root.treeData.push(self.mirror.node);
                        }

                    }

                }

                self.$root.refreshLevel(self.$root.treeData); //刷新节点编号

                var target = self.mirror.node.level; //节点目标位置

                typeof options.swapNode == 'function' ? options.swapNode(origin, target) : undefined;

                document.onmousemove = function(){};
                document.onmouseup = function(){};
                if(self.swapNode){self.swapNode.content.node.preview = "default";} //清除上一个标记的节点
                self.$root.currNodeMirror = null;
                self.swapNode = null;
            },

            /*** 获取样式方法 ***/
            getMirrorStyle : function(){
                var self = this;
                return {
                    top: self.mousePosition.top + 'px',
                    left: self.mousePosition.left + 'px'
                }
            },

            /*** 获取class方法 ***/
            getMirrorClass : function(){
                var self = this;
                return {
                    "node-mirror" : true,
                    "right" : self.isAllow && !self.isOverflow,
                    "error" : !self.isAllow && !self.isOverflow
                }
            },

            /*** 节点定位初始化 ***/
            nodesPositionInit : function(){
                var self = this;
                var tree = self.$root.treeData;
                self.setNodeArray(tree);
            },

            /**
             * 节点是否合法化
             * @param array 节点数组
             * @param node 是否包含该节点
             * @returns {boolean}
             */
            isCorrect : function(array, node){
                var self = this;
                if(self.isArray(array) && array.indexOf(node) == -1){
                    var result = true;
                    for(var i = 0; i < array.length ; i++){
                        if(self.isArray(array[i].articles) && array[i].articles.length > 0){
                            result = self.isCorrect(array[i].articles, node);
                            if(!result){
                                return result;
                            }
                        }
                    }
                    return result;
                }else{
                    if(self.swapNode){self.swapNode.content.node.preview = "default";} //清除上一个标记的节点
                    self.swapNode = null;
                    return false;
                }
            }
        },
        watch : {
            "mousePosition.top" : function(top){
                var self = this;
                var scrollTop = document.querySelector(".catalog").scrollTop; //滚动距离
                var nodeArray = self.nodeArray; //当前节点位置排序
                var maxOffsetTop = nodeArray.length * self.nodeHeight; //最大相对高偏移
                var offsetTop = top - self.catalog.offsetTop + scrollTop + self.swapOffset; //相对高偏移
                var nodeOffset = offsetTop % self.nodeHeight; //节点偏移
                var index = parseInt(offsetTop / self.nodeHeight);

                if(offsetTop <= 0){ //如果低于最小高度则算最前一个的开端
                    index = 0; //最小索引
                    nodeOffset = 0; //最始偏移
                }else if(offsetTop >= maxOffsetTop){ //如果超过最大高度则算最后一个的末端
                    index = nodeArray.length - 1; //最大索引
                    nodeOffset = self.nodeHeight -1; //最末偏移
                }

                var swapNode = nodeArray[index]; //要交换的节点

                var swapType = offsetTop >= maxOffsetTop ? "after" : nodeOffset > self.nodeHeight / 3 ? "inner" : "before"; //如果位置在最末端则放后面，不超过三分之一则放前面，超过则放里面

                if(self.swapNode){self.swapNode.content.node.preview = "default";} //清除上一个标记的节点

                if(!self.isOverflow && swapNode.node != self.mirror.node && self.isCorrect(self.mirror.node.articles, swapNode.node)){ //是否合法

                    self.isAllow = true; //允许交换

                    swapNode.node.preview = swapType; //交换类型

                    self.swapNode = {
                        content : swapNode,
                        swapType : swapType
                    };

                }else{
                    self.isAllow = false;
                    self.swapNode = null;
                }

            },
            "mousePosition.left" : function(left){
                var self = this;
                self.isOverflow = left > self.catalog.width; //如果超出目录范围
            }
        },
        created : function(){
            var self = this;
            document.onmousemove = self.moveMirror;
            document.onmouseup = self.cancelMirror;
            self.nodesPositionInit();
        }
    });

    var vm = window.vm = new Vue({
        el : '#container',
        data : {
            currActiveNode : null, //当前显示的节点
            currNodeMirror : null, //当前拖拽的节点
            treeData : [
                            {
                                "level": "1",
                                "title": "前言",
                                "ref": "README.md",
                                "articles": []
                            },
                            {
                                "level": "2",
                                "title": "材料与方法",
                                "ref": "ch1/cai_liao_yu_fang_fa.md",
                                "articles": [
                                    {
                                        "level": "2.1",
                                        "title": "动物",
                                        "ref": "ch1/dong_wu.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.2",
                                        "title": "药物与试剂",
                                        "ref": "ch1/yao_wu_yu_shi_ji.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.3",
                                        "title": "高脂饲料配方",
                                        "ref": "ch1/gao_zhi_si_liao_pei_fang.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.4",
                                        "title": "分组与造模方法",
                                        "ref": "ch1/fen_zu_yu_zao_mo_fang_fa.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.5",
                                        "title": "给药方法",
                                        "ref": "ch1/gei_yao_fang_fa.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.6",
                                        "title": "取材方法",
                                        "ref": "ch1/qu_cai_fang_fa.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "2.7",
                                        "title": "统计方法",
                                        "ref": "ch1/tong_ji_fang_fa.md",
                                        "articles": []
                                    }
                                ]
                            },
                            {
                                "level": "3",
                                "title": "检测结果",
                                "ref": "ch2/jian_ce_jie_guo.md",
                                "articles": []
                            },
                            {
                                "level": "4",
                                "title": "讨论",
                                "ref": "ch3/tao_lun.md",
                                "articles": [
                                    {
                                        "level": "4.1",
                                        "title": "结果",
                                        "ref": "jie_guo.md",
                                        "articles": []
                                    }
                                ]
                            },
                            {
                                "level": "5",
                                "title": "参考文献",
                                "ref": "can_kao_wen_xian.md",
                                "articles": [
                                    {
                                        "level": "5.1",
                                        "title": "测试",
                                        "ref": "ch4/ttt/ce_shi.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "5.2",
                                        "title": "测试4",
                                        "ref": "ce_shi_4.md",
                                        "articles": []
                                    },
                                    {
                                        "level": "5.3",
                                        "title": "嗡嗡嗡啊",
                                        "ref": "weng_weng_weng_a.md",
                                        "articles": [
                                            {
                                                "level": "5.3.1",
                                                "title": "嗡嗡嗡",
                                                "ref": "tc/weng_weng_weng.md",
                                                "articles": [
                                                    {
                                                        "level": "5.3.1.1",
                                                        "title": "测试3",
                                                        "ref": "ce_shi_3.md",
                                                        "articles": [
                                                            {
                                                                "level": "5.3.1.1.1",
                                                                "title": "测试2",
                                                                "ref": "ce_shi_2.md",
                                                                "articles": []
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "level": "5.3.1.2",
                                                        "title": "不不",
                                                        "ref": "bu_bu_bu.md",
                                                        "articles": [
                                                            {
                                                                "level": "5.3.1.2.1",
                                                                "title": "测试5",
                                                                "ref": "ce_shi_5.md",
                                                                "articles": [
                                                                    {
                                                                        "level": "5.3.1.2.1.1",
                                                                        "title": "测试7",
                                                                        "ref": "ce_shi_7.md",
                                                                        "articles": []
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "level": "6",
                                "title": "测试6",
                                "ref": "ce_shi_6.md",
                                "articles": []
                            }
                        ] //目录树数据
        },
        methods : {
            /**
             * 刷新节点编号
             * @param array 节点数组
             * @param index 节点编号前缀
             */
            refreshLevel : function(array, index){
                var self = this;
                for(var i = 0; Array.isArray(array) && i < array.length ; i++){
                    var item = array[i];
                    item.level = index ? index + "." + (i + 1) : i + 1 + "";
                    self.refreshLevel(item.articles, item.level);
                }
            }
        }
    });

    return vm;
});

window.onload = function(){

    var vm = catalog({
        activeNode : function(node){
            console.log(node.level, node.title);
        },
        swapNode : function(origin, target){
            console.log(origin, target);
        }
    });

};
