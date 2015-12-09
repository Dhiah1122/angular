'use strict';var angular2_1 = require('angular2/angular2');
var constants_1 = require('./constants');
var INITIAL_VALUE = {
    __UNINITIALIZED__: true
};
var DowngradeNg2ComponentAdapter = (function () {
    function DowngradeNg2ComponentAdapter(id, info, element, attrs, scope, parentInjector, parse, viewManager, protoView) {
        this.id = id;
        this.info = info;
        this.element = element;
        this.attrs = attrs;
        this.scope = scope;
        this.parentInjector = parentInjector;
        this.parse = parse;
        this.viewManager = viewManager;
        this.protoView = protoView;
        this.component = null;
        this.inputChangeCount = 0;
        this.inputChanges = null;
        this.hostViewRef = null;
        this.changeDetector = null;
        this.contentInserctionPoint = null;
        this.element[0].id = id;
        this.componentScope = scope.$new();
        this.childNodes = element.contents();
    }
    DowngradeNg2ComponentAdapter.prototype.bootstrapNg2 = function () {
        var childInjector = this.parentInjector.resolveAndCreateChild([angular2_1.provide(constants_1.NG1_SCOPE, { useValue: this.componentScope })]);
        this.hostViewRef =
            this.viewManager.createRootHostView(this.protoView, '#' + this.id, childInjector);
        var renderer = this.hostViewRef.render;
        var hostElement = this.viewManager.getHostElement(this.hostViewRef);
        this.changeDetector = this.hostViewRef.changeDetectorRef;
        this.component = this.viewManager.getComponent(hostElement);
        this.contentInserctionPoint = renderer.rootContentInsertionPoints[0];
    };
    DowngradeNg2ComponentAdapter.prototype.setupInputs = function () {
        var _this = this;
        var attrs = this.attrs;
        var inputs = this.info.inputs;
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var expr = null;
            if (attrs.hasOwnProperty(input.attr)) {
                var observeFn = (function (prop) {
                    var prevValue = INITIAL_VALUE;
                    return function (value) {
                        if (_this.inputChanges !== null) {
                            _this.inputChangeCount++;
                            _this.inputChanges[prop] =
                                new Ng1Change(value, prevValue === INITIAL_VALUE ? value : prevValue);
                            prevValue = value;
                        }
                        _this.component[prop] = value;
                    };
                })(input.prop);
                attrs.$observe(input.attr, observeFn);
            }
            else if (attrs.hasOwnProperty(input.bindAttr)) {
                expr = attrs[input.bindAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketAttr)) {
                expr = attrs[input.bracketAttr];
            }
            else if (attrs.hasOwnProperty(input.bindonAttr)) {
                expr = attrs[input.bindonAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketParenAttr)) {
                expr = attrs[input.bracketParenAttr];
            }
            if (expr != null) {
                var watchFn = (function (prop) { return function (value, prevValue) {
                    if (_this.inputChanges != null) {
                        _this.inputChangeCount++;
                        _this.inputChanges[prop] = new Ng1Change(prevValue, value);
                    }
                    _this.component[prop] = value;
                }; })(input.prop);
                this.componentScope.$watch(expr, watchFn);
            }
        }
        var prototype = this.info.type.prototype;
        if (prototype && prototype.ngOnChanges) {
            // Detect: OnChanges interface
            this.inputChanges = {};
            this.componentScope.$watch(function () { return _this.inputChangeCount; }, function () {
                var inputChanges = _this.inputChanges;
                _this.inputChanges = {};
                _this.component.ngOnChanges(inputChanges);
            });
        }
        this.componentScope.$watch(function () { return _this.changeDetector && _this.changeDetector.detectChanges(); });
    };
    DowngradeNg2ComponentAdapter.prototype.projectContent = function () {
        var childNodes = this.childNodes;
        if (this.contentInserctionPoint) {
            var parent = this.contentInserctionPoint.parentNode;
            for (var i = 0, ii = childNodes.length; i < ii; i++) {
                parent.insertBefore(childNodes[i], this.contentInserctionPoint);
            }
        }
    };
    DowngradeNg2ComponentAdapter.prototype.setupOutputs = function () {
        var _this = this;
        var attrs = this.attrs;
        var outputs = this.info.outputs;
        for (var j = 0; j < outputs.length; j++) {
            var output = outputs[j];
            var expr = null;
            var assignExpr = false;
            var bindonAttr = output.bindonAttr ? output.bindonAttr.substring(0, output.bindonAttr.length - 6) : null;
            var bracketParenAttr = output.bracketParenAttr ?
                "[(" + output.bracketParenAttr.substring(2, output.bracketParenAttr.length - 8) + ")]" :
                null;
            if (attrs.hasOwnProperty(output.onAttr)) {
                expr = attrs[output.onAttr];
            }
            else if (attrs.hasOwnProperty(output.parenAttr)) {
                expr = attrs[output.parenAttr];
            }
            else if (attrs.hasOwnProperty(bindonAttr)) {
                expr = attrs[bindonAttr];
                assignExpr = true;
            }
            else if (attrs.hasOwnProperty(bracketParenAttr)) {
                expr = attrs[bracketParenAttr];
                assignExpr = true;
            }
            if (expr != null && assignExpr != null) {
                var getter = this.parse(expr);
                var setter = getter.assign;
                if (assignExpr && !setter) {
                    throw new Error("Expression '" + expr + "' is not assignable!");
                }
                var emitter = this.component[output.prop];
                if (emitter) {
                    emitter.subscribe({
                        next: assignExpr ? (function (setter) { return function (value) { return setter(_this.scope, value); }; })(setter) :
                            (function (getter) { return function (value) { return getter(_this.scope, { $event: value }); }; })(getter)
                    });
                }
                else {
                    throw new Error("Missing emitter '" + output.prop + "' on component '" + this.info.selector + "'!");
                }
            }
        }
    };
    DowngradeNg2ComponentAdapter.prototype.registerCleanup = function () {
        var _this = this;
        this.element.bind('$remove', function () { return _this.viewManager.destroyRootHostView(_this.hostViewRef); });
    };
    return DowngradeNg2ComponentAdapter;
})();
exports.DowngradeNg2ComponentAdapter = DowngradeNg2ComponentAdapter;
var Ng1Change = (function () {
    function Ng1Change(previousValue, currentValue) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
    }
    Ng1Change.prototype.isFirstChange = function () { return this.previousValue === this.currentValue; };
    return Ng1Change;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmdyYWRlX25nMl9hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL3VwZ3JhZGUvZG93bmdyYWRlX25nMl9hZGFwdGVyLnRzIl0sIm5hbWVzIjpbIkRvd25ncmFkZU5nMkNvbXBvbmVudEFkYXB0ZXIiLCJEb3duZ3JhZGVOZzJDb21wb25lbnRBZGFwdGVyLmNvbnN0cnVjdG9yIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5ib290c3RyYXBOZzIiLCJEb3duZ3JhZGVOZzJDb21wb25lbnRBZGFwdGVyLnNldHVwSW5wdXRzIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5wcm9qZWN0Q29udGVudCIsIkRvd25ncmFkZU5nMkNvbXBvbmVudEFkYXB0ZXIuc2V0dXBPdXRwdXRzIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5yZWdpc3RlckNsZWFudXAiLCJOZzFDaGFuZ2UiLCJOZzFDaGFuZ2UuY29uc3RydWN0b3IiLCJOZzFDaGFuZ2UuaXNGaXJzdENoYW5nZSJdLCJtYXBwaW5ncyI6IkFBQUEseUJBVU8sbUJBQW1CLENBQUMsQ0FBQTtBQUMzQiwwQkFBd0IsYUFBYSxDQUFDLENBQUE7QUFLdEMsSUFBTSxhQUFhLEdBQUc7SUFDcEIsaUJBQWlCLEVBQUUsSUFBSTtDQUN4QixDQUFDO0FBRUY7SUFVRUEsc0NBQW9CQSxFQUFVQSxFQUFVQSxJQUFtQkEsRUFDdkNBLE9BQWlDQSxFQUFVQSxLQUEwQkEsRUFDckVBLEtBQXFCQSxFQUFVQSxjQUF3QkEsRUFDdkRBLEtBQTRCQSxFQUFVQSxXQUEyQkEsRUFDakVBLFNBQXVCQTtRQUp2QkMsT0FBRUEsR0FBRkEsRUFBRUEsQ0FBUUE7UUFBVUEsU0FBSUEsR0FBSkEsSUFBSUEsQ0FBZUE7UUFDdkNBLFlBQU9BLEdBQVBBLE9BQU9BLENBQTBCQTtRQUFVQSxVQUFLQSxHQUFMQSxLQUFLQSxDQUFxQkE7UUFDckVBLFVBQUtBLEdBQUxBLEtBQUtBLENB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SUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xEQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUNqQ0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDeERBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7WUFDdkNBLENBQUNBO1lBQ0RBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsSUFBSUEsT0FBT0EsR0FBR0EsQ0FBQ0EsVUFBQ0EsSUFBSUEsSUFBS0EsT0FBQUEsVUFBQ0EsS0FBS0EsRUFBRUEsU0FBU0E7b0JBQ3hDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFJQSxDQUFDQSxZQUFZQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDOUJBLEtBQUlBLENBQUNBLGdCQUFnQkEsRUFBRUEsQ0FBQ0E7d0JBQ3hCQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxTQUFTQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtvQkFDNURBLENBQUNBO29CQUNEQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtnQkFDL0JBLENBQUNBLEVBTndCQSxDQU14QkEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2ZBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVB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LENBQUNBLElBQUlBLHdCQUFtQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsT0FBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzVGQSxDQUFDQTtZQUNIQSxDQUFDQTtRQUNIQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVETCxzREFBZUEsR0FBZkE7UUFBQU0saUJBRUNBO1FBRENBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLFdBQVdBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsS0FBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBdERBLENBQXNEQSxDQUFDQSxDQUFDQTtJQUM3RkEsQ0FBQ0E7SUFDSE4sbUNBQUNBO0FBQURBLENBQUNBLEFBakpELElBaUpDO0FBakpZLG9DQUE0QiwrQkFpSnhDLENBQUE7QUFFRDtJQUNFTyxtQkFBbUJBLGFBQWtCQSxFQUFTQSxZQUFpQkE7UUFBNUNDLGtCQUFhQSxHQUFiQSxhQUFhQSxDQUFLQTtRQUFTQSxpQkFBWUEsR0FBWkEsWUFBWUEsQ0FBS0E7SUFBR0EsQ0FBQ0E7SUFFbkVELGlDQUFhQSxHQUFiQSxjQUEyQkUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsS0FBS0EsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDL0VGLGdCQUFDQTtBQUFEQSxDQUFDQSxBQUpELElBSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBiaW5kLFxuICBwcm92aWRlLFxuICBBcHBWaWV3TWFuYWdlcixcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIEhvc3RWaWV3UmVmLFxuICBJbmplY3RvcixcbiAgT25DaGFuZ2VzLFxuICBQcm90b1ZpZXdSZWYsXG4gIFNpbXBsZUNoYW5nZVxufSBmcm9tICdhbmd1bGFyMi9hbmd1bGFyMic7XG5pbXBvcnQge05HMV9TQ09QRX0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHtDb21wb25lbnRJbmZvfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCBFbGVtZW50ID0gcHJvdHJhY3Rvci5FbGVtZW50O1xuaW1wb3J0ICogYXMgYW5ndWxhciBmcm9tICcuL2FuZ3VsYXJfanMnO1xuXG5jb25zdCBJTklUSUFMX1ZBTFVFID0ge1xuICBfX1VOSU5JVElBTElaRURfXzogdHJ1ZVxufTtcblxuZXhwb3J0IGNsYXNzIERvd25ncmFkZU5nMkNvbXBvbmVudEFkYXB0ZXIge1xuICBjb21wb25lbnQ6IGFueSA9IG51bGw7XG4gIGlucHV0Q2hhbmdlQ291bnQ6IG51bWJlciA9IDA7XG4gIGlucHV0Q2hhbmdlczoge1trZXk6IHN0cmluZ106IFNpbXBsZUNoYW5nZX0gPSBudWxsO1xuICBob3N0Vmlld1JlZjogSG9zdFZpZXdSZWYgPSBudWxsO1xuICBjaGFuZ2VEZXRlY3RvcjogQ2hhbmdlRGV0ZWN0b3JSZWYgPSBudWxsO1xuICBjb21wb25lbnRTY29wZTogYW5ndWxhci5JU2NvcGU7XG4gIGNoaWxkTm9kZXM6IE5vZGVbXTtcbiAgY29udGVudEluc2VyY3Rpb25Qb2ludDogTm9kZSA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpZDogc3RyaW5nLCBwcml2YXRlIGluZm86IENvbXBvbmVudEluZm8sXG4gICAgICAgICAgICAgIHByaXZhdGUgZWxlbWVudDogYW5ndWxhci5JQXVnbWVudGVkSlF1ZXJ5LCBwcml2YXRlIGF0dHJzOiBhbmd1bGFyLklBdHRyaWJ1dGVzLFxuICAgICAgICAgICAgICBwcml2YXRlIHNjb3BlOiBhbmd1bGFyLklTY29wZSwgcHJpdmF0ZSBwYXJlbnRJbmplY3RvcjogSW5qZWN0b3IsXG4gICAgICAgICAgICAgIHByaXZhdGUgcGFyc2U6IGFuZ3VsYXIuSVBhcnNlU2VydmljZSwgcHJpdmF0ZSB2aWV3TWFuYWdlcjogQXBwVmlld01hbmFnZXIsXG4gICAgICAgICAgICAgIHByaXZhdGUgcHJvdG9WaWV3OiBQcm90b1ZpZXdSZWYpIHtcbiAgICAoPGFueT50aGlzLmVsZW1lbnRbMF0pLmlkID0gaWQ7XG4gICAgdGhpcy5jb21wb25lbnRTY29wZSA9IHNjb3BlLiRuZXcoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMgPSA8Tm9kZVtdPjxhbnk+ZWxlbWVudC5jb250ZW50cygpO1xuICB9XG5cbiAgYm9vdHN0cmFwTmcyKCkge1xuICAgIHZhciBjaGlsZEluamVjdG9yID0gdGhpcy5wYXJlbnRJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlQ2hpbGQoXG4gICAgICAgIFtwcm92aWRlKE5HMV9TQ09QRSwge3VzZVZhbHVlOiB0aGlzLmNvbXBvbmVudFNjb3BlfSldKTtcbiAgICB0aGlzLmhvc3RWaWV3UmVmID1cbiAgICAgICAgdGhpcy52aWV3TWFuYWdlci5jcmVhdGVSb290SG9zdFZpZXcodGhpcy5wcm90b1ZpZXcsICcjJyArIHRoaXMuaWQsIGNoaWxkSW5qZWN0b3IpO1xuICAgIHZhciByZW5kZXJlcjogYW55ID0gKDxhbnk+dGhpcy5ob3N0Vmlld1JlZikucmVuZGVyO1xuICAgIHZhciBob3N0RWxlbWVudCA9IHRoaXMudmlld01hbmFnZXIuZ2V0SG9zdEVsZW1lbnQodGhpcy5ob3N0Vmlld1JlZik7XG4gICAgdGhpcy5jaGFuZ2VEZXRlY3RvciA9IHRoaXMuaG9zdFZpZXdSZWYuY2hhbmdlRGV0ZWN0b3JSZWY7XG4gICAgdGhpcy5jb21wb25lbnQgPSB0aGlzLnZpZXdNYW5hZ2VyLmdldENvbXBvbmVudChob3N0RWxlbWVudCk7XG4gICAgdGhpcy5jb250ZW50SW5zZXJjdGlvblBvaW50ID0gcmVuZGVyZXIucm9vdENvbnRlbnRJbnNlcnRpb25Qb2ludHNbMF07XG4gIH1cblxuICBzZXR1cElucHV0cygpOiB2b2lkIHtcbiAgICB2YXIgYXR0cnMgPSB0aGlzLmF0dHJzO1xuICAgIHZhciBpbnB1dHMgPSB0aGlzLmluZm8uaW5wdXRzO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaW5wdXQgPSBpbnB1dHNbaV07XG4gICAgICB2YXIgZXhwciA9IG51bGw7XG4gICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoaW5wdXQuYXR0cikpIHtcbiAgICAgICAgdmFyIG9ic2VydmVGbiA9ICgocHJvcCkgPT4ge1xuICAgICAgICAgIHZhciBwcmV2VmFsdWUgPSBJTklUSUFMX1ZBTFVFO1xuICAgICAgICAgIHJldHVybiAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aGlzLmlucHV0Q2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgICAgdGhpcy5pbnB1dENoYW5nZXNbcHJvcF0gPVxuICAgICAgICAgICAgICAgICAgbmV3IE5nMUNoYW5nZSh2YWx1ZSwgcHJldlZhbHVlID09PSBJTklUSUFMX1ZBTFVFID8gdmFsdWUgOiBwcmV2VmFsdWUpO1xuICAgICAgICAgICAgICBwcmV2VmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50W3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSkoaW5wdXQucHJvcCk7XG4gICAgICAgIGF0dHJzLiRvYnNlcnZlKGlucHV0LmF0dHIsIG9ic2VydmVGbik7XG4gICAgICB9IGVsc2UgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGlucHV0LmJpbmRBdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbaW5wdXQuYmluZEF0dHJdO1xuICAgICAgfSBlbHNlIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShpbnB1dC5icmFja2V0QXR0cikpIHtcbiAgICAgICAgZXhwciA9IGF0dHJzW2lucHV0LmJyYWNrZXRBdHRyXTtcbiAgICAgIH0gZWxzZSBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoaW5wdXQuYmluZG9uQXR0cikpIHtcbiAgICAgICAgZXhwciA9IGF0dHJzW2lucHV0LmJpbmRvbkF0dHJdO1xuICAgICAgfSBlbHNlIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShpbnB1dC5icmFja2V0UGFyZW5BdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbaW5wdXQuYnJhY2tldFBhcmVuQXR0cl07XG4gICAgICB9XG4gICAgICBpZiAoZXhwciAhPSBudWxsKSB7XG4gICAgICAgIHZhciB3YXRjaEZuID0gKChwcm9wKSA9PiAodmFsdWUsIHByZXZWYWx1ZSkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmlucHV0Q2hhbmdlcyAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0Q2hhbmdlQ291bnQrKztcbiAgICAgICAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzW3Byb3BdID0gbmV3IE5nMUNoYW5nZShwcmV2VmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfSkoaW5wdXQucHJvcCk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50U2NvcGUuJHdhdGNoKGV4cHIsIHdhdGNoRm4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBwcm90b3R5cGUgPSB0aGlzLmluZm8udHlwZS5wcm90b3R5cGU7XG4gICAgaWYgKHByb3RvdHlwZSAmJiAoPE9uQ2hhbmdlcz5wcm90b3R5cGUpLm5nT25DaGFuZ2VzKSB7XG4gICAgICAvLyBEZXRlY3Q6IE9uQ2hhbmdlcyBpbnRlcmZhY2VcbiAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgICB0aGlzLmNvbXBvbmVudFNjb3BlLiR3YXRjaCgoKSA9PiB0aGlzLmlucHV0Q2hhbmdlQ291bnQsICgpID0+IHtcbiAgICAgICAgdmFyIGlucHV0Q2hhbmdlcyA9IHRoaXMuaW5wdXRDaGFuZ2VzO1xuICAgICAgICB0aGlzLmlucHV0Q2hhbmdlcyA9IHt9O1xuICAgICAgICAoPE9uQ2hhbmdlcz50aGlzLmNvbXBvbmVudCkubmdPbkNoYW5nZXMoaW5wdXRDaGFuZ2VzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFNjb3BlLiR3YXRjaCgoKSA9PiB0aGlzLmNoYW5nZURldGVjdG9yICYmIHRoaXMuY2hhbmdlRGV0ZWN0b3IuZGV0ZWN0Q2hhbmdlcygpKTtcbiAgfVxuXG4gIHByb2plY3RDb250ZW50KCkge1xuICAgIHZhciBjaGlsZE5vZGVzID0gdGhpcy5jaGlsZE5vZGVzO1xuICAgIGlmICh0aGlzLmNvbnRlbnRJbnNlcmN0aW9uUG9pbnQpIHtcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzLmNvbnRlbnRJbnNlcmN0aW9uUG9pbnQucGFyZW50Tm9kZTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNoaWxkTm9kZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNoaWxkTm9kZXNbaV0sIHRoaXMuY29udGVudEluc2VyY3Rpb25Qb2ludCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0dXBPdXRwdXRzKCkge1xuICAgIHZhciBhdHRycyA9IHRoaXMuYXR0cnM7XG4gICAgdmFyIG91dHB1dHMgPSB0aGlzLmluZm8ub3V0cHV0cztcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG91dHB1dHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBvdXRwdXQgPSBvdXRwdXRzW2pdO1xuICAgICAgdmFyIGV4cHIgPSBudWxsO1xuICAgICAgdmFyIGFzc2lnbkV4cHIgPSBmYWxzZTtcblxuICAgICAgdmFyIGJpbmRvbkF0dHIgPVxuICAgICAgICAgIG91dHB1dC5iaW5kb25BdHRyID8gb3V0cHV0LmJpbmRvbkF0dHIuc3Vic3RyaW5nKDAsIG91dHB1dC5iaW5kb25BdHRyLmxlbmd0aCAtIDYpIDogbnVsbDtcbiAgICAgIHZhciBicmFja2V0UGFyZW5BdHRyID1cbiAgICAgICAgICBvdXRwdXQuYnJhY2tldFBhcmVuQXR0ciA/XG4gICAgICAgICAgICAgIGBbKCR7b3V0cHV0LmJyYWNrZXRQYXJlbkF0dHIuc3Vic3RyaW5nKDIsIG91dHB1dC5icmFja2V0UGFyZW5BdHRyLmxlbmd0aCAtIDgpfSldYCA6XG4gICAgICAgICAgICAgIG51bGw7XG5cbiAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShvdXRwdXQub25BdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbb3V0cHV0Lm9uQXR0cl07XG4gICAgICB9IGVsc2UgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KG91dHB1dC5wYXJlbkF0dHIpKSB7XG4gICAgICAgIGV4cHIgPSBhdHRyc1tvdXRwdXQucGFyZW5BdHRyXTtcbiAgICAgIH0gZWxzZSBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYmluZG9uQXR0cikpIHtcbiAgICAgICAgZXhwciA9IGF0dHJzW2JpbmRvbkF0dHJdO1xuICAgICAgICBhc3NpZ25FeHByID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYnJhY2tldFBhcmVuQXR0cikpIHtcbiAgICAgICAgZXhwciA9IGF0dHJzW2JyYWNrZXRQYXJlbkF0dHJdO1xuICAgICAgICBhc3NpZ25FeHByID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4cHIgIT0gbnVsbCAmJiBhc3NpZ25FeHByICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGdldHRlciA9IHRoaXMucGFyc2UoZXhwcik7XG4gICAgICAgIHZhciBzZXR0ZXIgPSBnZXR0ZXIuYXNzaWduO1xuICAgICAgICBpZiAoYXNzaWduRXhwciAmJiAhc2V0dGVyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHByZXNzaW9uICcke2V4cHJ9JyBpcyBub3QgYXNzaWduYWJsZSFgKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZW1pdHRlciA9IHRoaXMuY29tcG9uZW50W291dHB1dC5wcm9wXTtcbiAgICAgICAgaWYgKGVtaXR0ZXIpIHtcbiAgICAgICAgICBlbWl0dGVyLnN1YnNjcmliZSh7XG4gICAgICAgICAgICBuZXh0OiBhc3NpZ25FeHByID8gKChzZXR0ZXIpID0+ICh2YWx1ZSkgPT4gc2V0dGVyKHRoaXMuc2NvcGUsIHZhbHVlKSkoc2V0dGVyKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKChnZXR0ZXIpID0+ICh2YWx1ZSkgPT4gZ2V0dGVyKHRoaXMuc2NvcGUsIHskZXZlbnQ6IHZhbHVlfSkpKGdldHRlcilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgZW1pdHRlciAnJHtvdXRwdXQucHJvcH0nIG9uIGNvbXBvbmVudCAnJHt0aGlzLmluZm8uc2VsZWN0b3J9JyFgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyQ2xlYW51cCgpIHtcbiAgICB0aGlzLmVsZW1lbnQuYmluZCgnJHJlbW92ZScsICgpID0+IHRoaXMudmlld01hbmFnZXIuZGVzdHJveVJvb3RIb3N0Vmlldyh0aGlzLmhvc3RWaWV3UmVmKSk7XG4gIH1cbn1cblxuY2xhc3MgTmcxQ2hhbmdlIGltcGxlbWVudHMgU2ltcGxlQ2hhbmdlIHtcbiAgY29uc3RydWN0b3IocHVibGljIHByZXZpb3VzVmFsdWU6IGFueSwgcHVibGljIGN1cnJlbnRWYWx1ZTogYW55KSB7fVxuXG4gIGlzRmlyc3RDaGFuZ2UoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnByZXZpb3VzVmFsdWUgPT09IHRoaXMuY3VycmVudFZhbHVlOyB9XG59XG4iXX0=