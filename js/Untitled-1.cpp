#include <bits/stdc++.h>
using namespace std;

using ll = long long;

ll N;
int K;
vector<pair<ll,ll>> blockSeg;   // (Li, Ri)

/* Gộp các đoạn và trả về tổng độ dài */
ll merged_length(vector<pair<ll,ll>> v) {
    if (v.empty()) return 0;
    sort(v.begin(), v.end());
    ll total = 0;
    ll l = v[0].first, r = v[0].second;

    for (int i = 1; i < (int)v.size(); i++) {
        if (v[i].first > r) {
            total += r - l;
            l = v[i].first;
            r = v[i].second;
        } else {
            r = max(r, v[i].second);
        }
    }
    total += r - l;
    return total;
}


vector<pair<ll,ll>> blocked_by_robot(ll x) {
    vector<pair<ll,ll>> res;
    for (auto &seg : blockSeg) {
        ll L = 2 * seg.first - x;
        ll R = 2 * seg.second - x;
        if (R <= 0 || L >= N) continue;
        L = max(L, 0LL);
        R = min(R, N);
        if (L < R) res.push_back({L, R});
    }
    return res;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> N >> K;
    blockSeg.resize(K);
    for (int i = 0; i < K; i++) {
        cin >> blockSeg[i].first >> blockSeg[i].second;
    }

    /* Sinh các vị trí robot cần xét */
    vector<ll> candidates;
    candidates.push_back(0);
    candidates.push_back(N);

    for (auto &seg : blockSeg) {
        ll a = 2 * seg.first;
        ll b = 2 * seg.second;
        if (0 <= a && a <= N) candidates.push_back(a);
        if (0 <= b && b <= N) candidates.push_back(b);
    }

    sort(candidates.begin(), candidates.end());
    candidates.erase(unique(candidates.begin(), candidates.end()), candidates.end());

    int M = candidates.size();

    /* Tiền xử lý: blocked[i] = các đoạn bị che của robot i */
    vector<vector<pair<ll,ll>>> blocked(M);
    for (int i = 0; i < M; i++) {
        blocked[i] = blocked_by_robot(candidates[i]);
    }

    ll ans = 0;

    /* Thử mọi cặp robot */
    for (int i = 0; i < M; i++) {
        for (int j = i + 1; j < M; j++) {
            vector<pair<ll,ll>> allBlocked = blocked[i];
