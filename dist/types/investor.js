"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
// New authentication types
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["COMPANY_ADMIN"] = "company_admin";
    UserRole["SUPER_VIEWER"] = "super_viewer";
    UserRole["COMPANY_VIEWER"] = "company_viewer";
    UserRole["SUPER_CREATOR"] = "super_creator";
    UserRole["COMPANY_CREATOR"] = "company_creator"; // Create data in their company (no edit/delete)
})(UserRole || (exports.UserRole = UserRole = {}));
