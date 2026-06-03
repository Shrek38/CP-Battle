// Static LeetCode problem bank — used as fallback when the live API is unavailable or too slow
const LC_FALLBACK = [
  // ── Easy ──────────────────────────────────────────────────────────────────
  { title: 'Two Sum',                       link: 'https://leetcode.com/problems/two-sum',                        difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Valid Parentheses',             link: 'https://leetcode.com/problems/valid-parentheses',              difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Merge Two Sorted Lists',        link: 'https://leetcode.com/problems/merge-two-sorted-lists',         difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Best Time to Buy and Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock', difficulty: 'Easy', platform: 'LeetCode' },
  { title: 'Valid Palindrome',              link: 'https://leetcode.com/problems/valid-palindrome',               difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Linked List Cycle',             link: 'https://leetcode.com/problems/linked-list-cycle',              difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Reverse Linked List',           link: 'https://leetcode.com/problems/reverse-linked-list',            difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Maximum Subarray',              link: 'https://leetcode.com/problems/maximum-subarray',               difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Climbing Stairs',               link: 'https://leetcode.com/problems/climbing-stairs',                difficulty: 'Easy',   platform: 'LeetCode' },
  { title: 'Contains Duplicate',            link: 'https://leetcode.com/problems/contains-duplicate',             difficulty: 'Easy',   platform: 'LeetCode' },

  // ── Medium ────────────────────────────────────────────────────────────────
  { title: 'Add Two Numbers',                              link: 'https://leetcode.com/problems/add-two-numbers',                              difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Longest Substring Without Repeating Characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters', difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Container With Most Water',                     link: 'https://leetcode.com/problems/container-with-most-water',                     difficulty: 'Medium', platform: 'LeetCode' },
  { title: '3Sum',                                          link: 'https://leetcode.com/problems/3sum',                                          difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Group Anagrams',                                link: 'https://leetcode.com/problems/group-anagrams',                                difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Merge Intervals',                               link: 'https://leetcode.com/problems/merge-intervals',                               difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Sort Colors',                                   link: 'https://leetcode.com/problems/sort-colors',                                   difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Word Search',                                   link: 'https://leetcode.com/problems/word-search',                                   difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Subsets',                                        link: 'https://leetcode.com/problems/subsets',                                       difficulty: 'Medium', platform: 'LeetCode' },
  { title: 'Binary Tree Level Order Traversal',             link: 'https://leetcode.com/problems/binary-tree-level-order-traversal',             difficulty: 'Medium', platform: 'LeetCode' },

  // ── Hard ──────────────────────────────────────────────────────────────────
  { title: 'Median of Two Sorted Arrays',            link: 'https://leetcode.com/problems/median-of-two-sorted-arrays',            difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Regular Expression Matching',             link: 'https://leetcode.com/problems/regular-expression-matching',             difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Merge k Sorted Lists',                   link: 'https://leetcode.com/problems/merge-k-sorted-lists',                   difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Trapping Rain Water',                     link: 'https://leetcode.com/problems/trapping-rain-water',                     difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'N-Queens',                                link: 'https://leetcode.com/problems/n-queens',                                difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Minimum Window Substring',                link: 'https://leetcode.com/problems/minimum-window-substring',                difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Largest Rectangle in Histogram',          link: 'https://leetcode.com/problems/largest-rectangle-in-histogram',          difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Word Ladder',                             link: 'https://leetcode.com/problems/word-ladder',                             difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Binary Tree Maximum Path Sum',            link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum',            difficulty: 'Hard', platform: 'LeetCode' },
  { title: 'Serialize and Deserialize Binary Tree',   link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree',   difficulty: 'Hard', platform: 'LeetCode' },
]

module.exports = LC_FALLBACK
